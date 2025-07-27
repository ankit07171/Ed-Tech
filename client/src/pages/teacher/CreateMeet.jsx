import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket.js";
import VideoGrid from "../../components/VideoGrid.jsx";
import axios from "axios";

export default function TeacherMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [started, setStarted] = useState(localStorage.getItem("started") === "true");
  const [localStream, setLocalStream] = useState(null);//teacher
  const [remoteStreams, setRemoteStreams] = useState({});//student
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const peerConnections = useRef({});
  const originalVideoTrack = useRef(null);//after scrnn share redirect to video

  useEffect(() => {
    if (started && code) {
      startMeet(code);
    }
  }, []);

  const generateCode = async () => {
    const res = await axios.post("/api/meet/create", {}, { withCredentials: true });
    const meetCode = res.data.code;
    setCode(meetCode);
    localStorage.setItem("meetCode", meetCode);
  };

  const startMeet = async (existingCode = code) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      originalVideoTrack.current = stream.getVideoTracks()[0];
      setStarted(true);

      localStorage.setItem("started", "true");
      localStorage.setItem("role", "teacher");
      localStorage.setItem("meetCode", existingCode);

      socket.emit("join-room", { code: existingCode, userId: "teacher", role: "teacher" });

      socket.on("user-joined", async ({ userId }) => {
        const pc = new RTCPeerConnection();
        peerConnections.current[userId] = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("signal", 
            { to: userId, signal: { type: "ice", candidate: e.candidate } });
        };

        pc.ontrack = (e) => {
          setRemoteStreams(prev => ({ ...prev, [userId]: e.streams[0] }));
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal", { to: userId, signal: { type: "offer", offer } });
      });

      socket.on("signal", async ({ from, signal }) => {
        const pc = peerConnections.current[from];
        if (!pc) return;

        if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.type === "ice") {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      });
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera/mic. Please check permissions.");
    }
  };

  const shareScreen = async () => {
    if (!isSharingScreen) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => stopScreenShare();

      setLocalStream(prev => {
        screenStream.getAudioTracks().forEach(track => prev.addTrack(track));
        return new MediaStream([screenTrack]);
      });

      setIsSharingScreen(true);
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (!originalVideoTrack.current) return;

    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track.kind === "video");
      if (sender) sender.replaceTrack(originalVideoTrack.current);
    });

    setLocalStream((prev) => {
      const newStream = new MediaStream();
      newStream.addTrack(originalVideoTrack.current);
      if (micOn) {
        const audioTrack = prev.getAudioTracks()[0];
        if (audioTrack) newStream.addTrack(audioTrack);
      }
      return newStream;
    });

    setIsSharingScreen(false);
  };

  const toggleMic = () => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach(track => track.stop());

    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    socket.disconnect();

    setStarted(false);
    setCode("");
    setLocalStream(null);
    setRemoteStreams({});
    setIsSharingScreen(false);
    localStorage.clear(); // remove code, started, role
  };

  const videoLabels = {
    self: "You (Teacher)",
    ...Object.keys(remoteStreams).reduce((acc, id) => ({
      ...acc,
      [id]: `Student (${id.slice(0, 5)})`
    }), {}),
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-purple-700 mb-4">
        Meeting Code: {code || "Not generated"}
      </h2>

      {!code && (
        <button
          onClick={generateCode}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Generate Code
        </button>
      )}

      {code && !started && (
        <button
          onClick={() => startMeet(code)}
          className="px-4 py-2 bg-purple-600 text-white rounded ml-4"
        >
          Start Meet
        </button>
      )}

      {started && (
        <>
          <VideoGrid
            localStream={localStream}
            remoteStreams={Object.values(remoteStreams)}
            labels={videoLabels}
          />
          <div className="mt-4 space-x-2">
            <button onClick={shareScreen} className="px-4 py-2 bg-blue-600 text-white rounded">
              {isSharingScreen ? "Stop Screen Share" : "Share Screen"}
            </button>
            <button onClick={toggleMic} className="px-4 py-2 bg-yellow-500 text-white rounded">
              {micOn ? "Mute" : "Unmute"}
            </button>
            <button onClick={toggleCam} className="px-4 py-2 bg-pink-500 text-white rounded">
              {camOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>
            <button onClick={handleLeave} className="px-4 py-2 bg-red-600 text-white rounded">
              Leave Meeting
            </button>
          </div>
        </>
      )}
    </div>
  );
}
