import { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "../../socket/socket";

export default function StudentJoinMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [joined, setJoined] = useState(localStorage.getItem("joined") === "true");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [name, setName] = useState(localStorage.getItem("userName") || "Student");

  const pcRef = useRef(null);
  const iceQueue = useRef([]);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (joined && code) joinMeet(code);
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    socket.on("teacher-left", () => {
      alert("Teacher has ended the meet.");
      handleLeave();
    });

    socket.on("signal", async ({ from, signal }) => {
      console.log("[Student] Received signal from", from);

      if (!pcRef.current) {
        console.warn("[Student] No peer connection yet, queueing signal");
        if (signal.type === "ice") iceQueue.current.push(signal.candidate);
        return;
      }

      const pc = pcRef.current;

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: { type: "answer", answer } });
      } else if (signal.type === "ice") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.error("Error adding ICE:", e);
        }
      }
    });

    return () => {
      socket.off("signal");
      socket.off("teacher-left");
    };
  }, []);

  const joinMeet = async (meetCode) => {
    try {
      const res = await axios.post("/api/meet/join", { code: meetCode }, { withCredentials: true });
      if (res.data.valid) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setJoined(true);

        localStorage.setItem("meetCode", meetCode);
        localStorage.setItem("joined", "true");
        localStorage.setItem("role", "student");

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          console.log("✅ Received track from teacher");
          setRemoteStream(e.streams[0]);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("signal", {
              to: res.data.teacherId,
              signal: { type: "ice", candidate: e.candidate },
            });
          }
        };

        iceQueue.current.forEach(async (c) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
            console.log("[Student] Processed queued ICE");
          } catch (err) {
            console.error("Failed to add queued ICE:", err);
          }
        });
        iceQueue.current = [];

        socket.emit("join-room", {
          code: meetCode,
          userId: socket.id,
          role: "student",
          name,
        });

        console.log("[Student] Joined room", meetCode);
      }
    } catch (err) {
      alert("Invalid meet code or error joining.");
      console.error(err);
    }
  };

  const handleJoinMeet = () => {
    joinMeet(code);
  };

  const toggleMic = () => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !micOn;
      setMicOn(audioTrack.enabled);
    }
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    pcRef.current = null;
    socket.disconnect();
    setJoined(false);
    setLocalStream(null);
    setRemoteStream(null);
    localStorage.clear();
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {!joined ? (
        <div className="space-y-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300">Enter Meet Code</h2>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC123"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
          <button
            onClick={handleJoinMeet}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
          >
            Join Meet
          </button>
        </div>
      ) : (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300">Waiting for teacher's video...</p>
          )}

          <div className="mt-4 space-x-3">
            <button
              onClick={toggleMic}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
            >
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Leave Meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
