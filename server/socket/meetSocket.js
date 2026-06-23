// roomUsers[code] = [{ socketId, role, name }]
const roomUsers = {};

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {

    // Teacher or student joins a room
    socket.on("join-room", ({ code, role, name }) => {
      if (!code) return;
      socket.join(code);

      if (!roomUsers[code]) roomUsers[code] = [];
      // Remove any previous entry for this socket
      roomUsers[code] = roomUsers[code].filter((u) => u.socketId !== socket.id);
      roomUsers[code].push({ socketId: socket.id, role, name });

      // When student joins, notify teacher
      if (role === "student") {
        const teacher = roomUsers[code].find((u) => u.role === "teacher");
        if (teacher) {
          io.to(teacher.socketId).emit("user-joined", { userId: socket.id, name });
          io.to(teacher.socketId).emit("user-message", { type: "join", name });
        }
      }

      // When teacher joins, tell them any students already in room
      if (role === "teacher") {
        const students = roomUsers[code].filter((u) => u.role === "student");
        students.forEach((s) => {
          socket.emit("user-joined", { userId: s.socketId, name: s.name });
        });
      }
    });

    // Get teacher socket ID for a room (student needs this to send ICE/answer)
    socket.on("get-teacher-socket", ({ code }) => {
      const teacher = roomUsers[code]?.find((u) => u.role === "teacher");
      socket.emit("teacher-socket", { teacherSocketId: teacher?.socketId || null });
    });

    // Relay WebRTC signals between peers
    socket.on("signal", ({ to, signal }) => {
      io.to(to).emit("signal", { from: socket.id, signal });
    });

    // End meet for everyone — only teacher should emit this
    socket.on("end-meet", ({ code }) => {
      io.to(code).emit("meet-ended");
      // Clean up room
      if (roomUsers[code]) delete roomUsers[code];
    });

    socket.on("leave-room", ({ code }) => {
      handleLeave(socket, io, code);
    });

    socket.on("disconnect", () => {
      // Find which room this socket was in
      for (const code of Object.keys(roomUsers)) {
        const user = roomUsers[code]?.find((u) => u.socketId === socket.id);
        if (user) {
          handleLeave(socket, io, code);
          break;
        }
      }
    });
  });
};

function handleLeave(socket, io, code) {
  const users = roomUsers[code];
  if (!users) return;

  const user = users.find((u) => u.socketId === socket.id);
  roomUsers[code] = users.filter((u) => u.socketId !== socket.id);

  if (!user) return;

  if (user.role === "teacher") {
    io.to(code).emit("teacher-left");
    delete roomUsers[code];
  } else {
    const teacher = roomUsers[code]?.find((u) => u.role === "teacher");
    if (teacher) {
      io.to(teacher.socketId).emit("user-left", { userId: socket.id, name: user.name });
      io.to(teacher.socketId).emit("user-message", { type: "leave", name: user.name });
    }
  }

  socket.leave(code);
}
