import React, { useEffect, useRef, useState } from "react"; 
import socket from "../../socket/socket";

export default function TeacherMeet() { 
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [started, setStarted] = useState(localStorage.getItem("meetStarted") === "1");
  const [stream, setStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [names, setNames] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState("");

  const teacherName = localStorage.getItem("userName") || "Teacher";

  const peerRefs = useRef({});
  const iceQueue = useRef({});
  const videoRefs = useRef({ self: null });

  useEffect(() => {
    if (started && stream) {
      socket.emit("join-room", { code, role: "teacher", name: teacherName });
    }
  }, [started, stream]);

  useEffect(() => {
    socket.on("user-joined", handleUserJoined);
    socket.on("signal", handleSignal);
    socket.on("user-left", handleUserLeft);
    socket.on("user-message", handleUserMessage);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("signal", handleSignal);
      socket.off("user-left", handleUserLeft);
      socket.off("user-message", handleUserMessage);
    };
  }, [stream]);

  const generateCode = async () => {
    const res = await fetch("/api/meet/create", { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.code) {
      Object.values(peerRefs.current).forEach((pc) => pc.close());
      peerRefs.current = {};
      iceQueue.current = {};
      setRemoteStreams({});
      setNames({});
      setCode(data.code);
      localStorage.setItem("meetCode", data.code);
      setStarted(false);
      setStream(null);
      localStorage.removeItem("meetStarted");
    }
  };

  const startMeet = async () => {
    try { 
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      localStorage.setItem("meetStarted", "1");
      setStarted(true);
    } catch {
      alert("Could not access media devices.");
    }
  };

  const handleUserJoined = async ({ userId, name }) => {
    setNames((prev) => ({ ...prev, [userId]: name }));

    const pc = new RTCPeerConnection();
    peerRefs.current[userId] = pc;

    // used for add tracks like video or audio to rtcp connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    //use for emiting the data of user(ip,port)
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", {
          to: userId,
          signal: { type: "ice", candidate: e.candidate },
        });
      }
    };

    // this funtion used for sending the video,audio stream
    // e.streams[0] contains the full MediaStream from the remote user.
    pc.ontrack = (e) => {
      setRemoteStreams((prev) => ({ ...prev, [userId]: e.streams[0] }));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("signal", {
      to: userId,
      signal: { type: "offer", offer },
    });

    // Handle any queued ICE candidates for this user
    if (iceQueue.current[userId]) {
      for (let candidate of iceQueue.current[userId]) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add queued ICE:", err);
        }
      }
      delete iceQueue.current[userId];
    }
  };

  const handleSignal = async ({ from, signal }) => {
    const pc = peerRefs.current[from];

    if (signal.type === "answer") {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      }
    } else if (signal.type === "ice") {
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.error("Error adding ICE:", err);
        }
      } else {
        if (!iceQueue.current[from]) iceQueue.current[from] = [];
        iceQueue.current[from].push(signal.candidate);
      }
    }
  };

  const handleUserLeft = ({ userId, name }) => {
    peerRefs.current[userId]?.close();
    delete peerRefs.current[userId];

    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });

    setNames((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });

    if (name) {
      setLeaveMsg(`👋 ${name} has left the meet`);
      setTimeout(() => setLeaveMsg(""), 3000);
    }
  };

  const toggleMic = () => {
    const audioTrack = stream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !micOn;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !camOn;
      setCamOn(videoTrack.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];

      Object.values(peerRefs.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = stopShare;
      setSharing(true);
    } catch {
      alert("Cannot share screen.");
    }
  };

  const stopShare = async () => {
    const cam = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(cam);
    Object.values(peerRefs.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(cam.getVideoTracks()[0]);
    });
    setSharing(false);
  };

  const handleUserMessage = ({ type, name }) => {
  if (type === "join") {
    setLeaveMsg(`👋 ${name} joined the meet`);
  } else if (type === "leave") {
    setLeaveMsg(`👋 ${name} left the meet`);
  }
  setTimeout(() => setLeaveMsg(""), 2000);
};


  const leaveMeet = () => {
    socket.emit("leave-room", { code });
    Object.values(peerRefs.current).forEach((pc) => pc.close());
    peerRefs.current = {};
    iceQueue.current = {};
    stream?.getTracks().forEach((t) => t.stop());
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    if (stream && videoRefs.current.self) {
      videoRefs.current.self.srcObject = stream;
    }
  }, [stream]);

  const count = 1 + Object.keys(remoteStreams).length;
  const gridCols =
    count <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : count <= 4
      ? "grid-cols-2 sm:grid-cols-2"
      : count <= 6
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-3 md:grid-cols-4";

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-bold mb-2">
        👨‍🏫 Meet Code: <span className="font-mono">{code || "—"}</span>
      </h2>
      {leaveMsg && <p className="mb-4 text-red-600 font-medium">{leaveMsg}</p>}

      {!started ? (
        <div className="flex gap-4 mb-6">
          <button onClick={generateCode} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Generate Code
          </button>
          <button onClick={startMeet} disabled={!code} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Start Meet
          </button>
        </div>
      ) : (
        <>
          <div className={`grid ${gridCols} gap-4 mb-6`}>
            <div>
              <video ref={(el) => (videoRefs.current.self = el)} autoPlay playsInline muted className="w-full h-64 object-cover bg-black rounded" />
              <p className="text-center mt-2">{teacherName} (You)</p>
            </div>
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div key={id}>
                <video
                  ref={(el) => {
                    if (el && !el.srcObject) el.srcObject = stream;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover bg-black rounded"
                />
                <p className="text-center mt-2">{names[id] || "Student"}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={shareScreen} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              {sharing ? "Stop Share" : "Share Screen"}
            </button>
            <button onClick={toggleMic} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button onClick={toggleCam} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              {camOn ? "Turn Off Cam" : "Turn On Cam"}
            </button>
            <button onClick={leaveMeet} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Leave Meet
            </button>
          </div>
        </>
      )}
    </div>
  );
}
