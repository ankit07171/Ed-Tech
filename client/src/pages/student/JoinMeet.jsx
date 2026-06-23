import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";

export default function StudentJoinMeet() {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  const studentName = localStorage.getItem("userName") || "Student";

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const iceQueue = useRef([]);
  const teacherSocketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const codeRef = useRef("");

  const setLocalStream = (s) => {
    localStreamRef.current = s;
    if (localVideoRef.current) localVideoRef.current.srcObject = s;
  };

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
        for (const c of iceQueue.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        iceQueue.current = [];
      } else if (signal.type === "ice") {
        try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); }
        catch { iceQueue.current.push(signal.candidate); }
      }
    };

    const onMeetEnded = () => {
      showMsg("Teacher ended the meet.");
      setTimeout(() => cleanup(), 1500);
    };

    const onTeacherLeft = () => {
      showMsg("Teacher left the meet.");
      setTimeout(() => cleanup(), 1500);
    };

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

  const showMsg = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const joinMeet = async () => {
    const trimCode = code.trim().toUpperCase();
    if (!trimCode) return alert("Enter a meet code");
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL || "http://localhost:7171"}/api/meet/join`,
        { method: "POST", headers, body: JSON.stringify({ code: trimCode }) }
      );
      const data = await res.json();
      if (!res.ok || !data.valid) return alert(data.error || "Invalid meet code");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      codeRef.current = trimCode;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onicecandidate = (e) => {
        if (e.candidate && teacherSocketRef.current)
          socket.emit("signal", { to: teacherSocketRef.current, signal: { type: "ice", candidate: e.candidate } });
      };

      socket.emit("join-room", { code: trimCode, role: "student", name: studentName });
      socket.emit("get-teacher-socket", { code: trimCode });

      setJoined(true);
      setMicOn(true);
      setCamOn(true);
      showMsg("Joined! Waiting for teacher's stream...");
    } catch (err) {
      alert("Failed to join. Check your meet code and try again.");
      console.error(err);
    }
  };

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
    setJoined(false);
    setRemoteStream(null);
    setCode("");
  };

  return (
    <div className="p-6 pt-20 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {!joined ? (
        <div className="space-y-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300">Join a Meet</h2>
          {statusMsg && <p className="text-sm text-green-600 dark:text-green-400">{statusMsg}</p>}
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter meet code e.g. ABC123"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={joinMeet}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
          >
            Join Meet
          </button>
        </div>
      ) : (
        // Full screen layout: teacher stream takes entire space, student is a PiP corner
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
          {/* Teacher stream — full screen */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">📡</div>
                <p className="text-lg">Waiting for teacher's stream...</p>
              </div>
            </div>
          )}

          {/* Status message */}
          {statusMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-full">
              {statusMsg}
            </div>
          )}

          {/* Self (student) PiP — bottom right corner */}
          <div className="absolute bottom-16 right-4 w-36 sm:w-48 rounded-lg overflow-hidden shadow-lg border-2 border-white border-opacity-30">
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="w-full object-cover"
            />
            {!camOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <span className="text-white text-xs">Cam Off</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
              {studentName}
            </div>
          </div>

          {/* Controls bar — fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 justify-center py-2 px-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <button
              onClick={toggleMic}
              className={`px-4 py-2 rounded text-white text-sm transition ${micOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-600 hover:bg-gray-700"}`}
            >
              {micOn ? "🎙 Mute" : "🎙 Unmute"}
            </button>
            <button
              onClick={toggleCam}
              className={`px-4 py-2 rounded text-white text-sm transition ${camOn ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 hover:bg-gray-700"}`}
            >
              {camOn ? "📷 Cam Off" : "📷 Cam On"}
            </button>
            <button
              onClick={cleanup}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Leave Meet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
