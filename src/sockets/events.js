const socket = require("../configs/socket");
const {
  addUser,
  removeSocket,
  getUserSockets,
  getOnlineFriends,
  getSocketUser,
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
      const onlineFriends = await getOnlineFriends(socket.username);
      io.to(socket.id).emit("SetOnlineFriends", onlineFriends);
    });

    //this will run when a user clicks on sync player
    socket.on("Sync:request", async (id, username) => {
      const friend = await getUserSockets(id);
      if (!friend) return socket.emit("Sync:user-offline", username);

      //TODO: handle multiple socket connections

      const friendSocket = friend.sockets[0];

      if (!friendSocket) return socket.emit("Sync:user-offline", username);

      socket.join(`Player-${id}`);
      socket.to(friendSocket).emit("Sync:connected-to");
      socket.emit("Sync:connected-with", id);
    });

    //Sync player with room id
    socket.on("Sync:player-track", (track, id) => {
      socket.to(`Player-${id}`).emit("Sync:player-track", track);
    });

    socket.on("Sync:player-slider", (time, id) => {
      socket.to(`Player-${id}`).emit("Sync:player-slider", time);
    });

    socket.on("Sync:player-state", (bool, id) => {
      socket.to(`Player-${id}`).emit("Sync:player-state", bool);
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
              socket.to(socketID).emit("FriendOffline", socket.username)
            );
          }
        });
      }
    });
  });
};

const initialConnHandler = async (socket) => {
  const { username, id } = socket;
  const user = await addUser(username, id);
  if (!user) throw new Error("Socket: User is undefined");
  const { friends } = user;

  if (friends.length) {
    friends.forEach((friend) => {
      const friendUser = getUserSockets(friend);
      if (friendUser) {
        friendUser.sockets.forEach((socketID) =>
          socket.to(socketID).emit("FriendOnline", username)
        );
      }
    });
  }
};
