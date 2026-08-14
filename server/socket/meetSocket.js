// Mesh-topology WebRTC signaling.
// Every participant (teacher AND student) connects directly to every other
// participant, so everyone sees/hears everyone — like a real Zoom/Meet call —
// instead of the old "students only see the teacher" hub model.
//
// roomUsers[code] = [{ socketId, role, name, micOn, camOn, handRaised }]
const roomUsers = {};

// Small helper: find a user's record + room in one lookup (used on disconnect)
function findUserRoom(socketId) {
  for (const code of Object.keys(roomUsers)) {
    const user = roomUsers[code]?.find((u) => u.socketId === socketId);
    if (user) return { code, user };
  }
  return null;
}

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {
    // ---- Join a meeting room ----
    socket.on("join-room", ({ code, role, name }) => {
      if (!code || !role || !name) return;

      socket.join(code);

      if (!roomUsers[code]) roomUsers[code] = [];
      // De-dupe in case of a stale reconnect from the same socket
      roomUsers[code] = roomUsers[code].filter((u) => u.socketId !== socket.id);

      // Snapshot of everyone already in the room BEFORE we add the joiner —
      // the joiner will initiate an offer to each of these (newcomer-offers
      // pattern avoids double-offer "glare" in a mesh).
      const existing = roomUsers[code].map((u) => ({
        userId: u.socketId,
        name: u.name,
        role: u.role,
        micOn: u.micOn,
        camOn: u.camOn,
        handRaised: u.handRaised,
        sharing: !!u.sharing,
      }));

      const me = { socketId: socket.id, role, name, micOn: true, camOn: true, handRaised: false, sharing: false };
      roomUsers[code].push(me);

      socket.emit("existing-participants", existing);

      // Tell everyone else a new participant arrived so they can render a
      // placeholder tile and wait for the incoming offer.
      socket.to(code).emit("user-joined", {
        userId: socket.id,
        name,
        role,
        micOn: true,
        camOn: true,
      });
    });

    // ---- Relay WebRTC signaling (offer / answer / ICE candidates) ----
    socket.on("signal", ({ to, signal }) => {
      if (!to || !signal) return;
      io.to(to).emit("signal", { from: socket.id, signal });
    });

    // ---- Mic/cam/hand-raise state broadcast (no renegotiation needed) ----
    socket.on("media-state", ({ code, micOn, camOn, handRaised, sharing }) => {
      const room = roomUsers[code];
      const user = room?.find((u) => u.socketId === socket.id);
      if (!user) return;
      if (typeof micOn === "boolean") user.micOn = micOn;
      if (typeof camOn === "boolean") user.camOn = camOn;
      if (typeof handRaised === "boolean") user.handRaised = handRaised;
      if (typeof sharing === "boolean") user.sharing = sharing;

      socket.to(code).emit("media-state", {
        userId: socket.id,
        micOn: user.micOn,
        camOn: user.camOn,
        handRaised: user.handRaised,
        sharing: user.sharing,
      });
    });

    // ---- In-meeting chat ----
    socket.on("chat-message", ({ code, text }) => {
      const room = roomUsers[code];
      const user = room?.find((u) => u.socketId === socket.id);
      if (!user || !text?.trim()) return;

      io.to(code).emit("chat-message", {
        userId: socket.id,
        name: user.name,
        role: user.role,
        text: String(text).slice(0, 1000),
        at: Date.now(),
      });
    });

    // ---- Teacher moderation: force-mute a student ----
    socket.on("force-mute", ({ code, targetId }) => {
      const room = roomUsers[code];
      const requester = room?.find((u) => u.socketId === socket.id);
      if (!requester || requester.role !== "teacher") return; // only teacher may moderate
      io.to(targetId).emit("force-mute");
    });

    // ---- Teacher moderation: remove a participant from the meet ----
    socket.on("remove-participant", ({ code, targetId }) => {
      const room = roomUsers[code];
      const requester = room?.find((u) => u.socketId === socket.id);
      if (!requester || requester.role !== "teacher") return; // only teacher may moderate
      io.to(targetId).emit("removed-from-meet");
      handleLeave(io.sockets.sockets.get(targetId) || { id: targetId, leave: () => {} }, io, code);
    });

    // ---- End meet for everyone (teacher only, enforced here) ----
    socket.on("end-meet", ({ code }) => {
      const room = roomUsers[code];
      const requester = room?.find((u) => u.socketId === socket.id);
      if (!requester || requester.role !== "teacher") return;
      io.to(code).emit("meet-ended");
      delete roomUsers[code];
    });

    socket.on("leave-room", ({ code }) => {
      handleLeave(socket, io, code);
    });

    socket.on("disconnect", () => {
      const found = findUserRoom(socket.id);
      if (found) handleLeave(socket, io, found.code);
    });
  });
};

function handleLeave(socket, io, code) {
  const users = roomUsers[code];
  if (!users) return;

  const user = users.find((u) => u.socketId === socket.id);
  roomUsers[code] = users.filter((u) => u.socketId !== socket.id);
  if (roomUsers[code].length === 0) delete roomUsers[code];

  if (!user) return;

  if (user.role === "teacher") {
    // Teacher leaving doesn't have to end the meet outright, but students
    // should know their host is gone so they can decide whether to stay.
    io.to(code).emit("teacher-left");
  }

  io.to(code).emit("user-left", { userId: socket.id, name: user.name });
  socket.leave?.(code);
}
