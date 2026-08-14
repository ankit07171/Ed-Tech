// Tiny singleton so REST controllers (which run outside the socket.io
// connection handler) can still push a realtime event, e.g. broadcasting a
// freshly-created notification the moment a teacher posts it.
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;
