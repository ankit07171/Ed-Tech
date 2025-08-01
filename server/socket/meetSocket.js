const roomUsers = {};

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ code, role,name }) => {
      socket.join(code);
      if (!roomUsers[code]) roomUsers[code] = [];
      roomUsers[code].push({ socketId: socket.id, role ,name});

      // Notify teacher when student joins
      const teacher = roomUsers[code].find(u => u.role === "teacher");
      if (role === "student" && teacher) {
        io.to(teacher.socketId).emit("user-joined", { userId: socket.id ,name});
      }

      // Handle signaling
      socket.on("signal", ({ to, signal }) => {
        io.to(to).emit("signal", { from: socket.id, signal });
      });

      // Disconnect
      socket.on("disconnect", () => {
        roomUsers[code] = roomUsers[code]?.filter(u => u.socketId !== socket.id);
        socket.broadcast.to(code).emit("user-disconnected", socket.id);
      });
    });
  });
};
