const roomUsers = {};

export const setupMeetSocket = (io) => {
  io.on("connection", (socket) => {

    socket.on("join-room", ({ meetCode, role, name }) => {
      socket.join(meetCode);
      if (!roomUsers[meetCode]) roomUsers[meetCode] = [];
      roomUsers[meetCode].push({ socketId: socket.id, role, name });

      const teacher = roomUsers[meetCode].find((u) => u.role === "teacher");

      if (role === "student" && teacher) {
        io.to(teacher.socketId).emit("user-joined", { userId: socket.id, name });
        io.to(teacher.socketId).emit("user-message", { type: "join", name });
      }

      socket.on("signal", ({ to, signal }) => {
        io.to(to).emit("signal", { from: socket.id, signal });
      });

      socket.on("disconnect", () => {
        const user = roomUsers[meetCode]?.find((u) => u.socketId === socket.id);
        roomUsers[meetCode] = roomUsers[meetCode]?.filter((u) => u.socketId !== socket.id);

        const teacher = roomUsers[meetCode]?.find((u) => u.role === "teacher");

        if (user?.role === "teacher") {
          io.to(meetCode).emit("teacher-left");
          delete roomUsers[meetCode];
        } else if (user?.role === "student" && teacher) {
          io.to(teacher.socketId).emit("user-left", {
            userId: socket.id,
            name: user.name,
          });
          io.to(teacher.socketId).emit("user-message", {type: "leave",name: user.name});
        }
      });
    });
  });
};
