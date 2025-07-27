const roomUsers = {}; // roomId => [{ socketId, role }]

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ code: roomId, userId, role }) => {
      
      socket.join(roomId);

      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      roomUsers[roomId].push({ socketId: socket.id, role, userId });

      // Notify teacher only when a student joins
      const teacher = roomUsers[roomId].find((u) => u.role === "teacher");
      if (role === "student" && teacher) {
        io.to(teacher.socketId).emit("user-joined", { userId: socket.id });
      }

      // Signal passing
      socket.on("signal", (data) => {
        io.to(data.to).emit("signal", {
          from: socket.id,
          signal: data.signal,
        });
      });

      socket.on("disconnect", () => {
        if (roomUsers[roomId]) {
          roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
          socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
        }
      });
    });
  });
};
