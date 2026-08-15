import { useCallback, useEffect, useRef, useState } from "react";
import socket from "../socket/socket";
import { ICE_SERVERS } from "../utils/iceConfig.js";

// Cap participants only for a soft UX warning — a full mesh is O(n^2)
// connections, so it stays smooth for a normal classroom size but the UI
// should let the teacher know if a call is getting large.
export const MESH_SOFT_LIMIT = 12;

/**
 * Full-mesh WebRTC meeting hook: every participant connects directly to
 * every other participant (audio + video), so everyone sees/hears everyone,
 * closer to how Zoom/Meet feels, instead of routing all video through the
 * teacher.
 */
export default function useMeshMeeting({ code, role, name, onEnded }) {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState({}); // userId -> {name, role, micOn, camOn, handRaised, stream}
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chat, setChat] = useState([]);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(true);

  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null); // kept so we can revert after screen share
  const peers = useRef({}); // userId -> RTCPeerConnection
  const iceQueues = useRef({}); // userId -> RTCIceCandidateInit[]
  const reconnectTimers = useRef({}); // userId -> timeout id, hard-closes a peer stuck in "failed"
  const initiatorFlags = useRef({}); // userId -> boolean, who is allowed to (re)send offers for this pair
  const codeRef = useRef(code);
  codeRef.current = code;

  const closePeer = useCallback((userId) => {
    peers.current[userId]?.close();
    delete peers.current[userId];
    delete iceQueues.current[userId];
    delete initiatorFlags.current[userId];
    if (reconnectTimers.current[userId]) {
      clearTimeout(reconnectTimers.current[userId]);
      delete reconnectTimers.current[userId];
    }
    setParticipants((prev) => {
      if (!(userId in prev)) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback((userId, isInitiator) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peers.current[userId] = pc;
    initiatorFlags.current[userId] = isInitiator;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", { to: userId, signal: { type: "ice", candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      setParticipants((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), stream },
      }));
    };

    // Handles BOTH the very first offer and any later renegotiation (like an
    // ICE restart) through one path. Only the side that originally initiated
    // this peer connection sends offers here — otherwise, when tracks are
    // (re)added on both ends at roughly the same time, both sides could try
    // to offer simultaneously ("glare") and the negotiation can wedge.
    pc.onnegotiationneeded = async () => {
      if (!initiatorFlags.current[userId]) return;
      if (pc.signalingState !== "stable") return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal", { to: userId, signal: { type: "offer", offer } });
      } catch {
        // Ignore — the next negotiationneeded/ICE-restart attempt will retry.
      }
    };

    pc.oniceconnectionstatechange = () => {
      setParticipants((prev) => (
        prev[userId] ? { ...prev, [userId]: { ...prev[userId], connState: pc.iceConnectionState } } : prev
      ));

      if (pc.iceConnectionState === "failed") {
        // Cross-network calls (different NATs/firewalls) can land here even
        // when the same-network case works fine — it means host/srflx
        // candidates didn't work and relay (TURN) either wasn't reachable or
        // wasn't negotiated in time. Try to self-heal with an ICE restart
        // before giving up, instead of silently leaving a blank tile.
        try { pc.restartIce(); } catch { /* not supported — will hard-close below */ }

        if (!reconnectTimers.current[userId]) {
          reconnectTimers.current[userId] = setTimeout(() => {
            if (peers.current[userId]?.iceConnectionState === "failed") closePeer(userId);
          }, 15000);
        }
      } else if (["connected", "completed"].includes(pc.iceConnectionState)) {
        if (reconnectTimers.current[userId]) {
          clearTimeout(reconnectTimers.current[userId]);
          delete reconnectTimers.current[userId];
        }
        // Helps diagnose "works locally, fails across networks" reports —
        // if this logs "relay" it means TURN was needed and worked; if a
        // call fails, checking whether it ever reached this point (and with
        // what candidate type) tells you whether the issue is ICE/TURN
        // reachability vs. something else entirely.
        pc.getStats?.().then((stats) => {
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated) {
              const local = stats.get(report.localCandidateId);
              const remote = stats.get(report.remoteCandidateId);
              if (local && remote) {
                // eslint-disable-next-line no-console
                console.debug(`[meet] connected to ${userId} via ${local.candidateType}->${remote.candidateType}`);
              }
            }
          });
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "closed") closePeer(userId);
    };

    return pc;
  }, [closePeer]);

  const [camUnavailable, setCamUnavailable] = useState(false);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [mediaWarning, setMediaWarning] = useState(""); // non-blocking, unlike `error`

  useEffect(() => {
    if (!mediaWarning) return;
    const t = setTimeout(() => setMediaWarning(""), 8000);
    return () => clearTimeout(t);
  }, [mediaWarning]);

  // Turns a raw getUserMedia error into something a person can actually act
  // on — "Could not start video source" on its own just means the browser
  // couldn't grab the camera, which is almost always because another app or
  // tab already has it open, not a permissions problem.
  const describeMediaError = (err) => {
    switch (err?.name) {
      case "NotReadableError":
      case "TrackStartError":
        return "Your camera or microphone is already in use by another app or browser tab (Zoom, Teams, another meeting tab, a camera app, etc). Close whatever else is using it and try again.";
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera/microphone access is blocked for this site. Check your browser's site settings (the camera icon in the address bar) and allow access, then reload.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No camera or microphone was found on this device.";
      case "OverconstrainedError":
        return "Your camera doesn't support the requested video settings.";
      default:
        return err?.message || "Unknown error accessing your camera/microphone.";
    }
  };

  // Renegotiates with every currently-connected peer regardless of who
  // originally initiated that connection — used after retryCamera() adds a
  // video track to a call that started audio-only, since that's a
  // deliberate one-off action (not a simultaneous auto-negotiation), so the
  // usual "only the initiator renegotiates" glare guard doesn't apply here.
  const renegotiateAll = useCallback(() => {
    Object.entries(peers.current).forEach(([userId, pc]) => {
      if (pc.signalingState !== "stable") return;
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer).then(() => offer))
        .then((offer) => socket.emit("signal", { to: userId, signal: { type: "offer", offer } }))
        .catch(() => {});
    });
  }, []);

  const retryCamera = useCallback(async () => {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = camStream.getVideoTracks()[0];
      cameraTrackRef.current = videoTrack;

      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const merged = new MediaStream([videoTrack, ...(audioTrack ? [audioTrack] : [])]);
      localStreamRef.current = merged;
      setLocalStream(merged);
      setCamOn(true);
      setCamUnavailable(false);

      Object.values(peers.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
        else pc.addTrack(videoTrack, merged);
      });
      renegotiateAll();
      socket.emit("media-state", { code: codeRef.current, camOn: true });
    } catch (err) {
      setMediaWarning(`Still couldn't access the camera: ${describeMediaError(err)}`);
    }
  }, [renegotiateAll]);

  const retryMic = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = micStream.getAudioTracks()[0];

      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const merged = new MediaStream([audioTrack, ...(videoTrack ? [videoTrack] : [])]);
      localStreamRef.current = merged;
      setLocalStream(merged);
      setMicOn(true);
      setMicUnavailable(false);

      Object.values(peers.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender) sender.replaceTrack(audioTrack);
        else pc.addTrack(audioTrack, merged);
      });
      renegotiateAll();
      socket.emit("media-state", { code: codeRef.current, micOn: true });
    } catch (err) {
      setMediaWarning(`Still couldn't access the microphone: ${describeMediaError(err)}`);
    }
  }, [renegotiateAll]);

  // ---- Setup: local media + socket wiring ----
  useEffect(() => {
    let cancelled = false;

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // Tries video+audio together first (the common case). If that fails
    // specifically because a device is busy, it retries once after a brief
    // pause (releasing a camera can take a beat), then falls back to
    // whichever of camera/mic actually works rather than blocking the user
    // entirely — better to join audio-only than not be able to join at all.
    const acquireMedia = async () => {
      try {
        return { stream: await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) };
      } catch (err) {
        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          await wait(700);
          try {
            return { stream: await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) };
          } catch {
            // fall through to per-device fallback below
          }
        }

        const [videoResult, audioResult] = await Promise.allSettled([
          navigator.mediaDevices.getUserMedia({ video: true }),
          navigator.mediaDevices.getUserMedia({ audio: true }),
        ]);

        if (videoResult.status === "fulfilled" || audioResult.status === "fulfilled") {
          const tracks = [];
          if (videoResult.status === "fulfilled") tracks.push(...videoResult.value.getVideoTracks());
          if (audioResult.status === "fulfilled") tracks.push(...audioResult.value.getAudioTracks());
          return {
            stream: new MediaStream(tracks),
            camFailed: videoResult.status === "rejected",
            micFailed: audioResult.status === "rejected",
          };
        }

        throw err; // both totally failed — surface the original combined error
      }
    };

    const start = async () => {
      try {
        const { stream, camFailed, micFailed } = await acquireMedia();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
        if (camFailed) { setCamOn(false); setCamUnavailable(true); }
        if (micFailed) { setMicOn(false); setMicUnavailable(true); }
        socket.emit("join-room", { code, role, name });
        setJoining(false);
      } catch (err) {
        setError(describeMediaError(err));
        setJoining(false);
      }
    };
    start();

    const onExisting = (list) => {
      setParticipants((prev) => {
        const next = { ...prev };
        list.forEach((p) => {
          next[p.userId] = { name: p.name, role: p.role, micOn: p.micOn, camOn: p.camOn, handRaised: !!p.handRaised, sharing: !!p.sharing, stream: next[p.userId]?.stream || null };
        });
        return next;
      });
      list.forEach((p) => createPeerConnection(p.userId, true));
    };

    const onUserJoined = ({ userId, name: n, role: r, micOn: m, camOn: c }) => {
      setParticipants((prev) => ({
        ...prev,
        [userId]: { name: n, role: r, micOn: m, camOn: c, handRaised: false, stream: prev[userId]?.stream || null },
      }));
      // Peer connection is created lazily when their offer arrives.
    };

    const onSignal = async ({ from, signal }) => {
      let pc = peers.current[from];
      try {
        if (signal.type === "offer") {
          if (!pc) pc = createPeerConnection(from, false);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const queued = iceQueues.current[from] || [];
          for (const c of queued) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore stale candidate */ }
          }
          iceQueues.current[from] = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { to: from, signal: { type: "answer", answer } });
        } else if (signal.type === "answer") {
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          }
        } else if (signal.type === "ice") {
          if (pc && pc.remoteDescription) {
            try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch { /* ignore */ }
          } else {
            if (!iceQueues.current[from]) iceQueues.current[from] = [];
            iceQueues.current[from].push(signal.candidate);
          }
        }
      } catch {
        // Swallow signaling races (e.g. a peer that left mid-negotiation).
      }
    };

    const onUserLeft = ({ userId }) => closePeer(userId);

    const onMediaState = ({ userId, micOn: m, camOn: c, handRaised: h, sharing: sh }) => {
      setParticipants((prev) => (
        prev[userId] ? { ...prev, [userId]: { ...prev[userId], micOn: m, camOn: c, handRaised: h, sharing: !!sh } } : prev
      ));
    };

    const onChat = (msg) => setChat((prev) => [...prev, msg]);

    const onForceMute = () => {
      const track = localStreamRef.current?.getAudioTracks()[0];
      if (track) track.enabled = false;
      setMicOn(false);
      socket.emit("media-state", { code: codeRef.current, micOn: false });
    };

    const onMeetEnded = () => onEnded?.("ended");
    const onTeacherLeft = () => onEnded?.("teacher-left");
    const onRemoved = () => onEnded?.("removed");

    socket.on("existing-participants", onExisting);
    socket.on("user-joined", onUserJoined);
    socket.on("signal", onSignal);
    socket.on("user-left", onUserLeft);
    socket.on("media-state", onMediaState);
    socket.on("chat-message", onChat);
    socket.on("force-mute", onForceMute);
    socket.on("meet-ended", onMeetEnded);
    socket.on("teacher-left", onTeacherLeft);
    socket.on("removed-from-meet", onRemoved);

    return () => {
      cancelled = true;
      socket.off("existing-participants", onExisting);
      socket.off("user-joined", onUserJoined);
      socket.off("signal", onSignal);
      socket.off("user-left", onUserLeft);
      socket.off("media-state", onMediaState);
      socket.off("chat-message", onChat);
      socket.off("force-mute", onForceMute);
      socket.off("meet-ended", onMeetEnded);
      socket.off("teacher-left", onTeacherLeft);
      socket.off("removed-from-meet", onRemoved);

      Object.keys(peers.current).forEach((id) => peers.current[id]?.close());
      peers.current = {};
      iceQueues.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, role, name]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socket.emit("media-state", { code: codeRef.current, micOn: track.enabled });
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    socket.emit("media-state", { code: codeRef.current, camOn: track.enabled });
  }, []);

  const toggleHand = useCallback(() => {
    setHandRaised((prev) => {
      const next = !prev;
      socket.emit("media-state", { code: codeRef.current, handRaised: next });
      return next;
    });
  }, []);

  const replaceOutgoingVideoTrack = useCallback((track) => {
    Object.values(peers.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(track);
    });
  }, []);

  const startShare = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      replaceOutgoingVideoTrack(screenTrack);

      // Rebuild the local preview stream so the tile shows the screen too.
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const newLocal = new MediaStream([screenTrack, ...(audioTrack ? [audioTrack] : [])]);
      localStreamRef.current = newLocal;
      setLocalStream(newLocal);
      setSharing(true);
      socket.emit("media-state", { code: codeRef.current, sharing: true });

      screenTrack.onended = () => stopShare();
    } catch {
      setError("Screen sharing was cancelled or is unavailable.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceOutgoingVideoTrack]);

  const stopShare = useCallback(async () => {
    try {
      let camTrack = cameraTrackRef.current;
      if (!camTrack || camTrack.readyState === "ended") {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        camTrack = cam.getVideoTracks()[0];
        cameraTrackRef.current = camTrack;
      }
      replaceOutgoingVideoTrack(camTrack);
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const newLocal = new MediaStream([camTrack, ...(audioTrack ? [audioTrack] : [])]);
      localStreamRef.current = newLocal;
      setLocalStream(newLocal);
      setSharing(false);
      socket.emit("media-state", { code: codeRef.current, sharing: false });
    } catch {
      setSharing(false);
      socket.emit("media-state", { code: codeRef.current, sharing: false });
    }
  }, [replaceOutgoingVideoTrack]);

  const sendChat = useCallback((text) => {
    if (!text?.trim()) return;
    socket.emit("chat-message", { code: codeRef.current, text: text.trim() });
  }, []);

  const muteParticipant = useCallback((targetId) => {
    socket.emit("force-mute", { code: codeRef.current, targetId });
  }, []);

  const removeParticipant = useCallback((targetId) => {
    socket.emit("remove-participant", { code: codeRef.current, targetId });
  }, []);

  const leave = useCallback(() => {
    socket.emit("leave-room", { code: codeRef.current });
  }, []);

  const endMeet = useCallback(() => {
    socket.emit("end-meet", { code: codeRef.current });
  }, []);

  return {
    joining,
    error,
    localStream,
    participants,
    micOn,
    camOn,
    sharing,
    handRaised,
    chat,
    camUnavailable,
    micUnavailable,
    mediaWarning,
    retryCamera,
    retryMic,
    toggleMic,
    toggleCam,
    toggleHand,
    startShare,
    stopShare,
    sendChat,
    muteParticipant,
    removeParticipant,
    leave,
    endMeet,
  };
}
