const socket = require("../configs/socket");
const {
  addUser,
  removeSocket,
  getUserSockets,
  getOnlineFriends,
} = require("../utils/socketHandler");

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

  io.on("connection", async (socket) => {
    await initialConnHandler(socket, io);

    socket.on("fetchOnlineFriends", async () => {
      console.log("inside fetch friends");
      const onlineFriends = await getOnlineFriends(socket.username);
      io.to(socket.id).emit("SetOnlineFriends", onlineFriends);
    });

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
      const dcUser = removeSocket(socket.id);
      if (!dcUser) return;
      const { friends } = dcUser;
      if (friends.length) {
        friends.forEach((friend) => {
          const friendUser = getUserSockets(friend);
          if (friendUser) {
            friendUser.sockets.forEach((socketID) =>
              io.to(socketID).emit("FriendOffline", socket.username)
            );
          }
        });
      }
    });
  });
};

const initialConnHandler = async (socket, io) => {
  const { username, id } = socket;
  const user = await addUser(username, id);
  if (!user) throw new Error("Socket: User is undefined");
  const { friends } = user;

  if (friends.length) {
    friends.forEach((friend) => {
      const friendUser = getUserSockets(friend);
      if (friendUser) {
        friendUser.sockets.forEach((socketID) =>
          io.to(socketID).emit("FriendOnline", username)
        );
      }
    });
  }
};
