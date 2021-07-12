const socket = require("../configs/socket");

module.exports = (server) => {
  const io = socket(server);

  io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
  });

  io.on("connection", (socket) => {
    console.log(socket.username);
    socket.on("MessageSent", (message) => {
      socket.broadcast.emit("ReceiveMessage", message);
    });
    socket.on("SyncPlayer", (data) => {
      socket.broadcast.emit("ReceiveSync", data);
    });

    socket.on("Seek", (time) => {
      socket.broadcast.emit("ReceiveSeek", time);
    });

    socket.on("join-room", (room) => {
      console.log("room joined ", room, socket.id);
      socket.join(room);
    });
    socket.on("disconnect", () => {
      console.log("disconnected ", socket.id);
    });
  });
};
