import { useEffect, useRef, useState, useCallback } from "react";
import axios from "../../utils/axiosConfig.js";
import socket from "../../socket/socket";
import { ICE_SERVERS } from "../../utils/iceConfig.js";

// Stable video tile — avoids re-mounting on parent re-renders
function VideoTile({ label, muted = false, style }) {
  const videoRef = useRef(null);

  // Expose the video element via a getter on the component instance
  // We store it on the div's dataset for parent to find
  return (
    <div className="relative bg-black rounded-lg overflow-hidden" style={style}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
        data-label={label}
      />
      <div className="absolute bottom-1 left-2 text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded z-10">
        {label}
      </div>
    </div>
  );
}

// Individual remote student tile with stable ref
function RemoteTile({ studentId, name, pcRef }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const pc = pcRef.current[studentId];
    if (!pc) return;

    // Build stream from existing receivers (if tracks already arrived)
    const tryAttach = () => {
      const tracks = pc.getReceivers().map((r) => r.track).filter((t) => t && t.readyState !== "ended");
      if (tracks.length > 0) {
        const stream = new MediaStream(tracks);
        if (el.srcObject?.id !== stream.id) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      }
    };

    tryAttach();
    // Poll a few times to catch delayed TURN tracks
    const t1 = setTimeout(tryAttach, 500);
    const t2 = setTimeout(tryAttach, 1500);
    const t3 = setTimeout(tryAttach, 3000);

    // Also listen for new tracks on the PC
    const onTrack = () => {
      tryAttach();
    };
    pc.addEventListener("track", onTrack);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      pc.removeEventListener("track", onTrack);
    };
  }, [studentId, pcRef]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-2 text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded z-10">
        {name}
      </div>
    </div>
  );
}

export default function TeacherMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [started, setStarted] = useState(false);
  // Use a ref for students list to avoid stale closure in socket handlers
  const studentsRef = useRef([]); // [{id, name}]
  const [studentsTick, setStudentsTick] = useState(0); // force re-render
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const teacherName = localStorage.getItem("userName") || "Teacher";
  const streamRef = useRef(null);
  const peerRefs = useRef({});
  const iceQueue = useRef({});
  const localVideoRef = useRef(null);

  const showMsg = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  // Whenever stream changes, update local video element
  const setStream = useCallback((s) => {
    streamRef.current = s;
    // Immediate attempt + retry to handle timing
    const attach = () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = s;
        if (s) localVideoRef.current.play().catch(() => {});
      }
    };
    attach();
    setTimeout(attach, 100);
    setTimeout(attach, 500);
  }, []);

  useEffect(() => {
    const onUserJoined = async ({ userId, name }) => {
      const s = streamRef.current;
      if (!s) return;

      // Add to ref immediately (no stale state issue)
      if (!studentsRef.current.find((p) => p.id === userId)) {
        studentsRef.current = [...studentsRef.current, { id: userId, name }];
        setStudentsTick((t) => t + 1); // trigger re-render
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerRefs.current[userId] = pc;

      // Add local tracks
      s.getTracks().forEach((track) => pc.addTrack(track, s));

      pc.onicecandidate = (e) => {
        if (e.candidate)
          socket.emit("signal", { to: userId, signal: { type: "ice", candidate: e.candidate } });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[Teacher] ICE ${name}:`, pc.iceConnectionState);
      };

      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socket.emit("signal", { to: userId, signal: { type: "offer", offer } });

      // Flush queued ICE
      (iceQueue.current[userId] || []).forEach(async (c) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      });
      delete iceQueue.current[userId];
    };

    const onSignal = async ({ from, signal }) => {
      const pc = peerRefs.current[from];
      if (signal.type === "answer") {
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        }
      } else if (signal.type === "ice") {
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch {}
        } else {
          if (!iceQueue.current[from]) iceQueue.current[from] = [];
          iceQueue.current[from].push(signal.candidate);
        }
      }
    };

    const onUserLeft = ({ userId, name }) => {
      peerRefs.current[userId]?.close();
      delete peerRefs.current[userId];
      studentsRef.current = studentsRef.current.filter((p) => p.id !== userId);
      setStudentsTick((t) => t + 1);
      showMsg(`👋 ${name || "Student"} left`);
    };

    socket.on("user-joined", onUserJoined);
    socket.on("signal", onSignal);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("signal", onSignal);
      socket.off("user-left", onUserLeft);
    };
  }, []);

  const generateCode = async () => {
    try {
      const res = await axios.post("/api/meet/create");
      const newCode = res.data.code;
      Object.values(peerRefs.current).forEach((pc) => pc.close());
      peerRefs.current = {};
      iceQueue.current = {};
      studentsRef.current = [];
      setStudentsTick((t) => t + 1);
      setStarted(false);
      setStream(null);
      setCode(newCode);
      localStorage.setItem("meetCode", newCode);
    } catch {
      alert("Failed to generate code. Are you logged in?");
    }
  };

  const startMeet = async () => {
    if (!code) return alert("Generate a code first");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setStarted(true);
      setMicOn(true);
      setCamOn(true);
      socket.emit("join-room", { code, role: "teacher", name: teacherName });
    } catch (err) {
      alert(`Camera/mic error: ${err.message}`);
    }
  };

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const shareScreen = async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = display.getVideoTracks()[0];
      Object.values(peerRefs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      const newStream = new MediaStream([screenTrack, ...(streamRef.current?.getAudioTracks() || [])]);
      setStream(newStream);
      screenTrack.onended = stopShare;
      setSharing(true);
    } catch { alert("Cannot share screen."); }
  };

  const stopShare = async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      Object.values(peerRefs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      const newStream = new MediaStream([camTrack, ...(streamRef.current?.getAudioTracks() || [])]);
      setStream(newStream);
      setSharing(false);
    } catch {}
  };

  const endMeet = () => {
    if (!window.confirm("End meet for everyone?")) return;
    socket.emit("end-meet", { code });
    cleanupAndReset();
  };

  const cleanupAndReset = () => {
    Object.values(peerRefs.current).forEach((pc) => pc.close());
    peerRefs.current = {};
    iceQueue.current = {};
    studentsRef.current = [];
    setStudentsTick((t) => t + 1);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStream(null);
    localStorage.removeItem("meetCode");
    setStarted(false);
    setCode("");
  };

  const students = studentsRef.current;
  const total = 1 + students.length;
  const cols = total === 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      className="bg-gray-900 text-white">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Code:</span>
          <span className="font-mono text-purple-300 font-bold tracking-widest">{code || "—"}</span>
          {code && (
            <button onClick={() => { navigator.clipboard.writeText(code); showMsg("Copied!"); }}
              className="text-xs px-2 py-0.5 bg-purple-700 hover:bg-purple-600 rounded">
              Copy
            </button>
          )}
        </div>
        {statusMsg && <span className="text-sm text-green-400">{statusMsg}</span>}
        {!started ? (
          <div className="flex gap-2">
            <button onClick={generateCode}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded">
              Generate Code
            </button>
            <button onClick={startMeet} disabled={!code}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-sm rounded disabled:opacity-50">
              Start Meet
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={sharing ? stopShare : shareScreen}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-sm rounded">
              {sharing ? "Stop Share" : "Share Screen"}
            </button>
            <button onClick={toggleMic}
              className={`px-3 py-1 text-sm rounded ${micOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-600"}`}>
              {micOn ? "🎙 Mute" : "🎙 Unmute"}
            </button>
            <button onClick={toggleCam}
              className={`px-3 py-1 text-sm rounded ${camOn ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600"}`}>
              {camOn ? "📷 Off" : "📷 On"}
            </button>
            <button onClick={endMeet}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-sm rounded font-semibold">
              End for All
            </button>
          </div>
        )}
      </div>

      {/* Video area */}
      {started ? (
        <div
          className="flex-1 overflow-hidden p-2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridAutoRows: "1fr",
            gap: "8px",
          }}
        >
          {/* Self tile — teacher's local video */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!camOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <span className="text-sm text-gray-300">📷 Off</span>
              </div>
            )}
            <div className="absolute bottom-1 left-2 text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded z-10">
              {teacherName} (You)
            </div>
          </div>

          {/* Remote student tiles */}
          {students.map((s) => (
            <RemoteTile key={s.id} studentId={s.id} name={s.name} pcRef={peerRefs} />
          ))}

          {/* Waiting placeholder */}
          {students.length === 0 && (
            <div className="bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-sm">Waiting for students...</p>
                <p className="text-xs mt-1 font-mono text-gray-500">{code}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Generate a code and start your meet
        </div>
      )}
    </div>
  );
}
