import { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff,
  Hand, MessageSquare, Users, PhoneOff, Send, X, ShieldAlert,
  Pin, PinOff, Maximize, Minimize, LayoutGrid, User, AlertTriangle, RefreshCw,
} from "lucide-react";
import useMeshMeeting, { MESH_SOFT_LIMIT } from "../../hooks/useMeshMeeting.js";

function Tile({
  stream, name, role, micOn, camOn, handRaised, isLocal, muted,
  sharing, size = "grid", pinned, onTogglePin, connState,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      if (el.srcObject !== stream) el.srcObject = stream;
      el.play?.().catch(() => {});
    }
  }, [stream]);

  const fit = sharing ? "object-contain bg-black" : "object-cover";
  const shape = size === "thumb"
    ? "w-32 h-20 shrink-0"
    : "w-full h-full";

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden ring-1 ring-white/5 ${size === "grid" ? "aspect-video" : shape}`}>
      {/* The <video> element stays mounted for the tile's whole lifetime —
          we only ever hide/show it with CSS. Earlier this was conditionally
          unmounted when the camera was off and remounted when turned back
          on, which on some browsers (notably reattaching a MediaStream to a
          brand-new <video> node) left the feed stuck blank after toggling
          the camera back on. Keeping one persistent element avoids that. */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full ${fit} ${camOn === false ? "hidden" : ""}`}
        />
      )}
      {(!stream || camOn === false) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          <div className={`${size === "thumb" ? "h-8 w-8 text-sm" : "h-14 w-14 text-lg"} rounded-full bg-purple-600/80 flex items-center justify-center font-semibold text-white`}>
            {(name || "?").charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {handRaised && (
        <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 rounded-full p-1.5 shadow">
          <Hand size={size === "thumb" ? 10 : 14} />
        </div>
      )}

      {sharing && size !== "thumb" && (
        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <ScreenShare size={10} /> Presenting
        </div>
      )}

      {!isLocal && (connState === "failed" || connState === "disconnected") && size !== "thumb" && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
          <span className="bg-black/70 text-amber-300 text-xs font-medium px-3 py-1 rounded-full animate-pulse">
            Reconnecting… (network issue)
          </span>
        </div>
      )}

      {onTogglePin && size !== "thumb" && (
        <button
          onClick={onTogglePin}
          title={pinned ? "Unpin (back to grid)" : "Pin for me"}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur transition"
          style={{ display: handRaised ? "none" : undefined }}
        >
          {pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>
      )}
      {onTogglePin && size === "thumb" && (
        <button onClick={onTogglePin} title="Pin" className="absolute inset-0" />
      )}

      {size !== "thumb" && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-lg">
          {micOn === false ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-green-400" />}
          <span className="text-xs text-white font-medium">
            {name} {isLocal ? "(You)" : ""}{role === "teacher" ? " · Host" : ""}
          </span>
        </div>
      )}
      {size === "thumb" && (
        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] text-white font-medium max-w-[7.5rem] truncate">
          {name}{isLocal ? " (You)" : ""}
        </div>
      )}
    </div>
  );
}

/**
 * Shared full-mesh conferencing UI, used by both the teacher and student
 * "meet" pages. Everyone in the room sees and hears everyone else.
 *
 * Supports:
 *  - Grid view (default) of everyone.
 *  - Spotlight/pin view: click the pin icon on any tile (including your own)
 *    to make it large — handy for a student who only wants the teacher big.
 *  - Auto-spotlight: the moment anyone starts screen sharing, everyone's
 *    view automatically switches to a large view of that share, since a
 *    small grid tile is unreadable for slides/code.
 *  - True browser full-screen for the whole meeting.
 */
export default function MeetingRoom({ code, role, name, onExit }) {
  const {
    joining, error, localStream, participants,
    micOn, camOn, sharing, handRaised, chat,
    camUnavailable, micUnavailable, mediaWarning, retryCamera, retryMic,
    toggleMic, toggleCam, toggleHand, startShare, stopShare,
    sendChat, muteParticipant, removeParticipant, leave, endMeet,
  } = useMeshMeeting({ code, role, name, onEnded: onExit });

  const [panel, setPanel] = useState(null); // 'chat' | 'participants' | null
  const [chatInput, setChatInput] = useState("");
  const [pinnedId, setPinnedId] = useState(null); // null=auto-follow share, 'grid'=force grid, 'local'/id=manual pin
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, panel]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  const participantList = Object.entries(participants);
  const total = participantList.length + 1;
  const cols = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  // Whoever is currently sharing their screen (local takes priority if both
  // somehow overlap momentarily) drives the automatic spotlight.
  const remoteSharerId = participantList.find(([, p]) => p.sharing)?.[0] || null;
  const autoSpotlightId = sharing ? "local" : remoteSharerId;
  const spotlightId = pinnedId === "grid" ? null : (pinnedId || autoSpotlightId);

  const togglePin = (id) => setPinnedId((prev) => (prev === id ? "grid" : id));

  const teacherEntry = participantList.find(([, p]) => p.role === "teacher");

  const handleLeave = () => {
    leave();
    onExit?.("left");
  };

  const handleEndForAll = () => {
    if (!window.confirm("End this meeting for everyone?")) return;
    endMeet();
    onExit?.("ended");
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white px-6">
        <div className="max-w-sm text-center space-y-3">
          <ShieldAlert className="mx-auto text-red-400" size={32} />
          <p className="text-sm text-gray-300">{error}</p>
          <button onClick={() => onExit?.("error")} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-sm text-gray-400">Connecting to meeting…</p>
      </div>
    );
  }

  // Build a lookup so the spotlight can render whichever tile (local or
  // remote) is currently targeted, without duplicating the tile markup.
  const tileFor = (id) => {
    if (id === "local") {
      return { stream: localStream, name, role, micOn, camOn, handRaised, isLocal: true, muted: true, sharing };
    }
    const p = participants[id];
    if (!p) return null;
    return { stream: p.stream, name: p.name, role: p.role, micOn: p.micOn, camOn: p.camOn, handRaised: p.handRaised, sharing: p.sharing, connState: p.connState };
  };

  const spotlightTile = spotlightId ? tileFor(spotlightId) : null;
  const otherIds = ["local", ...participantList.map(([id]) => id)].filter((id) => id !== spotlightId);

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-gray-800 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Code:</span>
          <span className="font-mono text-purple-300 font-bold tracking-widest text-sm">{code}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs px-2 py-0.5 bg-purple-700 hover:bg-purple-600 rounded"
          >
            Copy
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {role === "student" && teacherEntry && pinnedId !== teacherEntry[0] && (
            <button
              onClick={() => setPinnedId(teacherEntry[0])}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded-full"
            >
              <User size={12} /> View Teacher Only
            </button>
          )}
          {spotlightId && (
            <button
              onClick={() => setPinnedId("grid")}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full"
            >
              <LayoutGrid size={12} /> Grid View
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full" title="Full screen">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <span className="flex items-center gap-1 text-xs text-gray-400"><Users size={13} /> {total}</span>
          {total > MESH_SOFT_LIMIT && (
            <span className="text-amber-400 text-xs">Large call — video quality may drop</span>
          )}
        </div>
      </div>

      {/* Camera/mic unavailable banner — lets people join and stay in the
          call even if a device was busy/blocked at first, with a one-tap
          retry once they've freed it up. */}
      {(camUnavailable || micUnavailable || mediaWarning) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-900/40 border-b border-amber-700/60 text-amber-200 text-xs flex-wrap">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="flex-1 min-w-[200px]">
            {mediaWarning || (
              camUnavailable && micUnavailable
                ? "Camera and microphone aren't available — you joined without them."
                : camUnavailable
                ? "Camera isn't available right now — you joined with audio only."
                : "Microphone isn't available right now — you joined with video only."
            )}
          </span>
          {camUnavailable && (
            <button
              onClick={retryCamera}
              className="flex items-center gap-1 px-2 py-1 bg-amber-700 hover:bg-amber-600 rounded text-amber-50 font-medium"
            >
              <RefreshCw size={12} /> Retry camera
            </button>
          )}
          {micUnavailable && (
            <button
              onClick={retryMic}
              className="flex items-center gap-1 px-2 py-1 bg-amber-700 hover:bg-amber-600 rounded text-amber-50 font-medium"
            >
              <RefreshCw size={12} /> Retry microphone
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main viewing area: grid OR spotlight+thumbnail strip */}
        {spotlightTile ? (
          <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
            <div className="flex-1 min-h-0">
              <Tile
                {...spotlightTile}
                size="spotlight"
                pinned
                onTogglePin={() => setPinnedId("grid")}
              />
            </div>
            {otherIds.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
                {otherIds.map((id) => {
                  const t = tileFor(id);
                  if (!t) return null;
                  return (
                    <Tile
                      key={id}
                      {...t}
                      size="thumb"
                      muted={id === "local"}
                      onTogglePin={() => togglePin(id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex-1 p-3 overflow-y-auto"
            style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: "10px", alignContent: "start" }}
          >
            <Tile
              stream={localStream} name={name} role={role} micOn={micOn} camOn={camOn}
              handRaised={handRaised} isLocal muted sharing={sharing}
              onTogglePin={() => togglePin("local")}
            />
            {participantList.map(([id, p]) => (
              <Tile
                key={id}
                stream={p.stream} name={p.name} role={p.role} micOn={p.micOn} camOn={p.camOn}
                handRaised={p.handRaised} sharing={p.sharing} connState={p.connState}
                onTogglePin={() => togglePin(id)}
              />
            ))}
          </div>
        )}

        {/* Side panel */}
        {panel && (
          <div className="w-72 shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-sm font-semibold">{panel === "chat" ? "In-call chat" : `Participants (${total})`}</span>
              <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
            </div>

            {panel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
                  {chat.length === 0 && <p className="text-gray-500 text-xs">No messages yet.</p>}
                  {chat.map((m, i) => (
                    <div key={i}>
                      <span className="font-semibold text-purple-300">{m.name}</span>
                      <span className="text-gray-500 text-xs ml-1">{m.role === "teacher" ? "(Host)" : ""}</span>
                      <p className="text-gray-200 break-words">{m.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); sendChat(chatInput); setChatInput(""); }}
                  className="flex items-center gap-1.5 p-2 border-t border-gray-700"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message everyone…"
                    className="flex-1 bg-gray-900 text-sm px-2 py-1.5 rounded outline-none border border-gray-700 focus:border-purple-500"
                  />
                  <button type="submit" className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded">
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}

            {panel === "participants" && (
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{name} (You){role === "teacher" ? " · Host" : ""}</span>
                  <div className="flex items-center gap-2">
                    {micOn ? <Mic size={13} className="text-green-400" /> : <MicOff size={13} className="text-red-400" />}
                    <button onClick={() => togglePin("local")} className="text-gray-400 hover:text-white">
                      {pinnedId === "local" ? <PinOff size={13} /> : <Pin size={13} />}
                    </button>
                  </div>
                </div>
                {participantList.map(([id, p]) => (
                  <div key={id} className="flex items-center justify-between border-t border-gray-700/60 pt-2">
                    <div>
                      <p>{p.name}{p.role === "teacher" ? " · Host" : ""}</p>
                      {p.handRaised && <p className="text-amber-400 text-xs flex items-center gap-1"><Hand size={11} /> hand raised</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.micOn ? <Mic size={13} className="text-green-400" /> : <MicOff size={13} className="text-red-400" />}
                      <button onClick={() => togglePin(id)} className="text-gray-400 hover:text-white">
                        {pinnedId === id ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                      {role === "teacher" && (
                        <>
                          <button onClick={() => muteParticipant(id)} title="Mute" className="text-xs px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded">Mute</button>
                          <button onClick={() => { if (window.confirm(`Remove ${p.name}?`)) removeParticipant(id); }} title="Remove" className="text-xs px-1.5 py-0.5 bg-red-700 hover:bg-red-600 rounded">Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700 flex-wrap shrink-0">
        <button onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
          className={`p-2.5 rounded-full ${micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"}`}>
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button onClick={toggleCam} title={camOn ? "Turn camera off" : "Turn camera on"}
          className={`p-2.5 rounded-full ${camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"}`}>
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button onClick={sharing ? stopShare : startShare} title={sharing ? "Stop sharing" : "Share screen"}
          className={`p-2.5 rounded-full ${sharing ? "bg-indigo-600 hover:bg-indigo-500" : "bg-gray-700 hover:bg-gray-600"}`}>
          {sharing ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
        </button>
        <button onClick={toggleHand} title="Raise hand"
          className={`p-2.5 rounded-full ${handRaised ? "bg-amber-500 hover:bg-amber-400 text-amber-950" : "bg-gray-700 hover:bg-gray-600"}`}>
          <Hand size={18} />
        </button>
        <button onClick={toggleFullscreen} title="Full screen"
          className={`p-2.5 rounded-full ${isFullscreen ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button onClick={() => setPanel(panel === "chat" ? null : "chat")} title="Chat"
          className={`p-2.5 rounded-full ${panel === "chat" ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}>
          <MessageSquare size={18} />
        </button>
        <button onClick={() => setPanel(panel === "participants" ? null : "participants")} title="Participants"
          className={`p-2.5 rounded-full ${panel === "participants" ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}>
          <Users size={18} />
        </button>
        <button onClick={handleLeave} title="Leave" className="p-2.5 rounded-full bg-red-600 hover:bg-red-500">
          <PhoneOff size={18} />
        </button>
        {role === "teacher" && (
          <button onClick={handleEndForAll} className="px-3 py-2 rounded-full bg-red-800 hover:bg-red-700 text-xs font-semibold">
            End for All
          </button>
        )}
      </div>
    </div>
  );
}
