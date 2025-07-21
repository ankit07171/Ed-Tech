import { useEffect, useRef } from "react";

export default function VideoGrid({ localStream, remoteStreams = [], labels = {} }) {
  const videoRefs = useRef({});

  const allStreams = [
    { stream: localStream, id: "self" },
    ...remoteStreams.map((stream, index) => {
      const id = Object.keys(labels).filter((k) => k !== "self")[index] || `user-${index}`;
      return { stream, id };
    }),
  ];

  useEffect(() => {
    allStreams.forEach(({ stream, id }) => {
      const video = videoRefs.current[id];
      if (video && stream && video.srcObject !== stream) {
        video.srcObject = stream;
      }
    });
  }, [allStreams]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {allStreams.map(({ stream, id }) =>
        stream ? (
          <div key={id} className="flex flex-col items-center">
            <video
              autoPlay
              playsInline
              muted={id === "self"}
              ref={(el) => (videoRefs.current[id] = el)}
              className="rounded-xl shadow w-full h-auto"
            />
            <p className="mt-2 text-sm text-gray-600 font-semibold">
              {labels[id] || (id === "self" ? "You" : "Participant")}
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}
