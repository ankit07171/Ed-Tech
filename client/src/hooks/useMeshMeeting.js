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
  const codeRef = useRef(code);
  codeRef.current = code;

  const closePeer = useCallback((userId) => {
    peers.current[userId]?.close();
    delete peers.current[userId];
    delete iceQueues.current[userId];
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

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        // 'disconnected' can be transient on flaky networks, so only hard
        // close on the terminal states to avoid dropping a recoverable peer.
        if (pc.connectionState !== "disconnected") closePeer(userId);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer).then(() => offer))
        .then((offer) => {
          socket.emit("signal", { to: userId, signal: { type: "offer", offer } });
        })
        .catch(() => setError("Failed to start a connection with a participant."));
    }

    return pc;
  }, [closePeer]);

  // ---- Setup: local media + socket wiring ----
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
        socket.emit("join-room", { code, role, name });
        setJoining(false);
      } catch (err) {
        setError(`Could not access camera/microphone: ${err.message}`);
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
