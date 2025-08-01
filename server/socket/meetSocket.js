const roomUsers = {};

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ code, role, name }) => {
      socket.join(code);
      if (!roomUsers[code]) roomUsers[code] = [];
      roomUsers[code].push({ socketId: socket.id, role, name });

      const teacher = roomUsers[code].find((u) => u.role === "teacher");

      if (role === "student" && teacher) {
        io.to(teacher.socketId).emit("user-joined", { userId: socket.id, name });
        io.to(teacher.socketId).emit("user-message", { type: "join", name });
      }

      socket.on("signal", ({ to, signal }) => {
        io.to(to).emit("signal", { from: socket.id, signal });
      });

      socket.on("disconnect", () => {
        const user = roomUsers[code]?.find((u) => u.socketId === socket.id);
        roomUsers[code] = roomUsers[code]?.filter((u) => u.socketId !== socket.id);

        const teacher = roomUsers[code]?.find((u) => u.role === "teacher");

        if (user?.role === "teacher") {
          io.to(code).emit("teacher-left");
          delete roomUsers[code];
        } else if (user?.role === "student" && teacher) {
          io.to(teacher.socketId).emit("user-left", {
            userId: socket.id,
            name: user.name,
          });
          io.to(teacher.socketId).emit("user-message", {
            type: "leave",
            name: user.name,
          });
        }
      });
    });
  });
};
