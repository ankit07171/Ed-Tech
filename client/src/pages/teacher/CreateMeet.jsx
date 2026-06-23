import { useEffect, useRef, useState } from "react";
import axios from "../../utils/axiosConfig.js";
import socket from "../../socket/socket";
import { ICE_SERVERS } from "../../utils/iceConfig.js";

export default function TeacherMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [started, setStarted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [names, setNames] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const teacherName = localStorage.getItem("userName") || "Teacher";

  // Use refs for everything that needs to be accessed inside socket callbacks
  const streamRef = useRef(null);
  const peerRefs = useRef({});
  const iceQueue = useRef({});
  const localVideoRef = useRef(null);
  const codeRef = useRef(code);

  useEffect(() => { codeRef.current = code; }, [code]);

  // Attach local stream to video element whenever stream ref changes
  const setStream = (s) => {
    streamRef.current = s;
    if (localVideoRef.current) localVideoRef.current.srcObject = s;
  };

  // Socket listeners — run once, use refs inside
  useEffect(() => {
    const onUserJoined = async ({ userId, name }) => {
      const s = streamRef.current;
      if (!s) return;
      setNames((prev) => ({ ...prev, [userId]: name }));

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerRefs.current[userId] = pc;

      s.getTracks().forEach((track) => pc.addTrack(track, s));

      pc.onicecandidate = (e) => {
        if (e.candidate)
          socket.emit("signal", { to: userId, signal: { type: "ice", candidate: e.candidate } });
      };

      pc.ontrack = (e) => {
        setRemoteStreams((prev) => ({ ...prev, [userId]: e.streams[0] }));
      };

      const offer = await pc.createOffer();
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
      if (signal.type === "answer" && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === "ice") {
        if (pc) {
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
      setRemoteStreams((prev) => { const c = { ...prev }; delete c[userId]; return c; });
      setNames((prev) => { const c = { ...prev }; delete c[userId]; return c; });
      showMsg(`👋 ${name} left`);
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

  const showMsg = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const generateCode = async () => {
    try {
      const res = await axios.post("/api/meet/create");
      const newCode = res.data.code;
      Object.values(peerRefs.current).forEach((pc) => pc.close());
      peerRefs.current = {};
      iceQueue.current = {};
      setRemoteStreams({});
      setNames({});
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
    } catch {
      alert("Could not access camera/microphone. Please allow permissions.");
    }
  };

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      Object.values(peerRefs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = stopShare;
      setSharing(true);
    } catch {
      alert("Cannot share screen.");
    }
  };

  const stopShare = async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = cam.getVideoTracks()[0];
      Object.values(peerRefs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      // Swap into streamRef too so local preview updates
      const oldStream = streamRef.current;
      const newStream = new MediaStream([
        camTrack,
        ...(oldStream?.getAudioTracks() || []),
      ]);
      setStream(newStream);
      setSharing(false);
    } catch {}
  };

  // End meet for EVERYONE — teacher only
  const endMeet = () => {
    if (!window.confirm("End meet for everyone?")) return;
    socket.emit("end-meet", { code });
    cleanupAndReset();
  };

  // Teacher leaves without ending for others
  const leaveMeet = () => {
    socket.emit("leave-room", { code });
    cleanupAndReset();
  };

  const cleanupAndReset = () => {
    Object.values(peerRefs.current).forEach((pc) => pc.close());
    peerRefs.current = {};
    iceQueue.current = {};
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStream(null);
    localStorage.removeItem("meetCode");
    setStarted(false);
    setRemoteStreams({});
    setNames({});
    setCode("");
  };

  const count = 1 + Object.keys(remoteStreams).length;

  return (
    <div className="p-6 pt-20 bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-bold mb-1">
        Meet Code:{" "}
        <span className="font-mono text-purple-600 select-all">{code || "—"}</span>
        {code && (
          <button
            onClick={() => { navigator.clipboard.writeText(code); showMsg("Code copied!"); }}
            className="ml-3 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 transition"
          >
            Copy
          </button>
        )}
      </h2>

      {statusMsg && <p className="mt-1 mb-3 text-sm text-green-600 dark:text-green-400 font-medium">{statusMsg}</p>}

      {!started ? (
        <div className="flex gap-4 mt-4">
          <button onClick={generateCode} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Generate Code
          </button>
          <button
            onClick={startMeet}
            disabled={!code}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Start Meet
          </button>
        </div>
      ) : (
        <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
          {/* 50/50 video grid */}
          <div className="grid grid-cols-2 gap-2 flex-1 p-2 overflow-hidden">
            {/* Self (teacher) */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!camOn && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <span className="text-white">📷 Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
                {teacherName} (You)
              </div>
            </div>

            {/* First connected student, or waiting placeholder */}
            {Object.entries(remoteStreams)[0] ? (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={(el) => { if (el) el.srcObject = Object.entries(remoteStreams)[0][1]; }}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
                  {names[Object.entries(remoteStreams)[0][0]] || "Student"}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 text-sm">Waiting for student...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center py-2 px-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button onClick={sharing ? stopShare : shareScreen} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
              {sharing ? "Stop Share" : "Share Screen"}
            </button>
            <button onClick={toggleMic} className={`px-4 py-2 text-white text-sm rounded transition ${micOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-500 hover:bg-gray-600"}`}>
              {micOn ? "🎙 Mute" : "🎙 Unmute"}
            </button>
            <button onClick={toggleCam} className={`px-4 py-2 text-white text-sm rounded transition ${camOn ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 hover:bg-gray-600"}`}>
              {camOn ? "📷 Cam Off" : "📷 Cam On"}
            </button>
            <button onClick={endMeet} className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-semibold">End Meet for All</button>
          </div>
        </div>
      )}
    </div>
  );
}
