import { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "../../socket/socket";

export default function StudentJoinMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [joined, setJoined] = useState(localStorage.getItem("joined") === "true");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);

  const peerConnections = useRef({});

  useEffect(() => {
    if (joined && code) joinMeet(code);
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

        socket.emit("join-room", { code: meetCode, userId: socket.id, role: "student" });

        socket.on("signal", async ({ from, signal }) => {
          let pc = peerConnections.current[from];
          if (!pc) {
            pc = new RTCPeerConnection();
            peerConnections.current[from] = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                socket.emit("signal", {
                  to: from,
                  signal: { type: "ice", candidate: e.candidate },
                });
              }
            };

            pc.ontrack = (e) => {
              setRemoteStream(e.streams[0]);
            };
          }

          if (signal.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", { to: from, signal: { type: "answer", answer } });
          } else if (signal.type === "ice") {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        });
      }
    } catch (err) {
      alert("Invalid meet code or error joining. Please try again.");
      console.error(err);
    }
  };

  const handleJoinMeet = () => {
    joinMeet(code);
  };

  const toggleMic = () => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const handleLeave = () => {
    // Close media stream
    localStream?.getTracks().forEach(track => track.stop());

    // Close peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    socket.disconnect();

    setJoined(false);
    setLocalStream(null);
    setRemoteStream(null);
    localStorage.clear(); // remove role, code, joined
  };

  return (
    <div className="p-6">
      {!joined ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-purple-700">Enter Meet Code</h2>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC123"
            className="border px-4 py-2 rounded"
          />
          <button
            onClick={handleJoinMeet}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Join Meet
          </button>
        </div>
      ) : (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center">
          {remoteStream ? (
            <video
              ref={(video) => {
                if (video) video.srcObject = remoteStream;
              }}
              autoPlay
              playsInline
              controls={false}
              className="w-full h-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <p className="text-gray-500">Waiting for teacher's video...</p>
          )}

          <div className="mt-4 space-x-3">
            <button
              onClick={toggleMic}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Leave Meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
