import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";
import { ICE_SERVERS } from "../../utils/iceConfig.js";

const BASE = import.meta.env.VITE_BASE_URL || "http://localhost:7171";

export default function StudentJoinMeet() {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const studentName = localStorage.getItem("userName") || "Student";

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const iceQueue = useRef([]);
  const teacherSocketRef = useRef(null);
  const localVideoRef = useRef(null);
  const teacherVideoRef = useRef(null);
  const codeRef = useRef("");

  // Attach local stream to video element
  const attachLocal = (s) => {
    localStreamRef.current = s;
    const el = localVideoRef.current;
    if (el && s) {
      el.srcObject = s;
      el.play().catch(() => {});
    }
  };

  // Try to pull tracks from PC receivers and show on teacher video
  const tryAttachTeacher = () => {
    const pc = pcRef.current;
    const el = teacherVideoRef.current;
    if (!pc || !el) return;

    const tracks = pc.getReceivers()
      .map((r) => r.track)
      .filter((t) => t && t.readyState !== "ended");

    if (tracks.length === 0) return;

    // Build or update stream
    if (!el.srcObject || el.srcObject.getTracks().length !== tracks.length) {
      const stream = new MediaStream(tracks);
      el.srcObject = stream;
      el.play().catch(() => {});
      console.log("[Student] Attached teacher stream, tracks:", tracks.map((t) => t.kind));
    }
  };

  useEffect(() => {
    const onTeacherSocket = ({ teacherSocketId }) => {
      if (teacherSocketId) teacherSocketRef.current = teacherSocketId;
    };

    const onSignal = async ({ from, signal }) => {
      const pc = pcRef.current;
      if (!pc) {
        if (signal.type === "ice") iceQueue.current.push(signal.candidate);
        return;
      }

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: { type: "answer", answer } });
        teacherSocketRef.current = from;

        // Flush ICE
        for (const c of iceQueue.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        iceQueue.current = [];

        // Start trying to attach teacher video
        tryAttachTeacher();
        setTimeout(tryAttachTeacher, 500);
        setTimeout(tryAttachTeacher, 1500);
        setTimeout(tryAttachTeacher, 3000);

      } else if (signal.type === "ice") {
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); }
          catch { iceQueue.current.push(signal.candidate); }
        } else {
          iceQueue.current.push(signal.candidate);
        }
      }
    };

    const onMeetEnded = () => { setStatusMsg("Teacher ended the meet."); setTimeout(cleanup, 2000); };
    const onTeacherLeft = () => { setStatusMsg("Teacher left."); setTimeout(cleanup, 2000); };

    socket.on("teacher-socket", onTeacherSocket);
    socket.on("signal", onSignal);
    socket.on("meet-ended", onMeetEnded);
    socket.on("teacher-left", onTeacherLeft);

    return () => {
      socket.off("teacher-socket", onTeacherSocket);
      socket.off("signal", onSignal);
      socket.off("meet-ended", onMeetEnded);
      socket.off("teacher-left", onTeacherLeft);
    };
  }, []);

  const joinMeet = async () => {
    const trimCode = code.trim().toUpperCase();
    if (!trimCode) return setErrorMsg("Enter a meet code");
    setErrorMsg("");
    setStatusMsg("Connecting...");

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/api/meet/join`, {
        method: "POST", headers, body: JSON.stringify({ code: trimCode }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(`Error: ${data.error || res.status}`); setStatusMsg(""); return; }
      if (!data.valid) { setErrorMsg("Invalid meet code"); setStatusMsg(""); return; }
    } catch (err) {
      setErrorMsg(`Cannot reach server: ${err.message}`);
      setStatusMsg("");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      setErrorMsg(`Camera/mic: ${err.message}`);
      setStatusMsg("");
      return;
    }

    attachLocal(stream);
    codeRef.current = trimCode;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && teacherSocketRef.current)
        socket.emit("signal", { to: teacherSocketRef.current, signal: { type: "ice", candidate: e.candidate } });
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[Student] ICE:", pc.iceConnectionState);
      // When connected/completed, try attaching teacher stream
      if (["connected", "completed"].includes(pc.iceConnectionState)) {
        tryAttachTeacher();
        setTimeout(tryAttachTeacher, 500);
      }
    };

    // ontrack fires when teacher's tracks arrive
    pc.ontrack = (e) => {
      console.log("[Student] ontrack:", e.track.kind);
      tryAttachTeacher();
      setTimeout(tryAttachTeacher, 200);
      setTimeout(tryAttachTeacher, 800);
    };

    socket.emit("join-room", { code: trimCode, role: "student", name: studentName });
    socket.emit("get-teacher-socket", { code: trimCode });

    setJoined(true);
    setMicOn(true);
    setCamOn(true);
    setStatusMsg("Joined! Waiting for teacher's video...");
  };

  // After joining, retry attaching local video (in case ref wasn't ready)
  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [joined]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const cleanup = () => {
    socket.emit("leave-room", { code: codeRef.current });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    teacherSocketRef.current = null;
    iceQueue.current = [];
    setJoined(false);
    setCode("");
    setStatusMsg("");
    setErrorMsg("");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      className="bg-gray-900 text-white">
      {!joined ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm px-6 space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Join a Meet</h2>
            {errorMsg && (
              <div className="bg-red-900 border border-red-700 text-red-300 text-sm px-3 py-2 rounded">
                {errorMsg}
              </div>
            )}
            {statusMsg && (
              <div className="bg-blue-900 border border-blue-700 text-blue-300 text-sm px-3 py-2 rounded">
                {statusMsg}
              </div>
            )}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter meet code e.g. ABC123"
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="text-xs text-gray-500 bg-gray-800 px-3 py-2 rounded space-y-1">
              <div>Backend: <span className="font-mono text-gray-400">{BASE}</span></div>
              <div>Token: <span className={localStorage.getItem("token") ? "text-green-400" : "text-red-400"}>
                {localStorage.getItem("token") ? "✅ present" : "❌ missing"}
              </span></div>
            </div>
            <button onClick={joinMeet}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold transition">
              Join Meet
            </button>
          </div>
        </div>
      ) : (
        // Teacher video fullscreen, local video as small PiP
        <div className="flex-1 relative overflow-hidden bg-black">
          {/* Teacher — fullscreen background */}
          <video
            ref={teacherVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Waiting overlay — shown while teacher video not loaded */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-black"
            style={{ display: "none" }}
            ref={(el) => {
              // Show overlay only if teacher video has no srcObject yet
              if (!el) return;
              const check = () => {
                const hasVideo = teacherVideoRef.current?.srcObject?.getTracks().length > 0;
                el.style.display = hasVideo ? "none" : "flex";
              };
              check();
              const t = setInterval(check, 500);
              setTimeout(() => clearInterval(t), 30000);
            }}
          >
            <div className="text-5xl mb-3">📡</div>
            <p>Waiting for teacher's video...</p>
            {statusMsg && <p className="mt-2 text-sm text-blue-400">{statusMsg}</p>}
          </div>

          {/* Teacher label */}
          <div className="absolute top-3 left-3 text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded z-10">
            Teacher
          </div>

          {/* Self — small PiP bottom right */}
          <div className="absolute bottom-14 right-3 w-28 sm:w-36 rounded-lg overflow-hidden border border-white border-opacity-20 shadow-lg z-10">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <span className="text-xs">Cam Off</span>
              </div>
            )}
            <div className="absolute bottom-0 left-1 text-xs bg-black bg-opacity-60 px-1 rounded">
              {studentName}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 justify-center py-2 px-4 bg-black bg-opacity-70 z-10">
            <button onClick={toggleMic}
              className={`px-4 py-1.5 text-sm rounded ${micOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-600 hover:bg-gray-500"}`}>
              {micOn ? "🎙 Mute" : "🎙 Unmute"}
            </button>
            <button onClick={toggleCam}
              className={`px-4 py-1.5 text-sm rounded ${camOn ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 hover:bg-gray-500"}`}>
              {camOn ? "📷 Cam Off" : "📷 Cam On"}
            </button>
            <button onClick={cleanup}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-sm rounded">
              Leave Meet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
