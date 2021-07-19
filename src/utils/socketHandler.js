const User = require("../models/user");

const users = new Map();
const sockets = new Map();

exports.addSocket = (socketID, userID) => {
  sockets.set(socketID, userID);
};

exports.getSocketUser = (socketID) => {
  return sockets.get(socketID);
};

exports.addUser = async (userID, socketID) => {
  if (!userID || !socketID) return undefined;
  this.addSocket(socketID, userID);
  let user = users.get(userID);
  if (user) {
    user.sockets.push(socketID);
  } else {
    const friends = [];
    try {
      const userInfo = await User.findById(userID, "friends");
      if (userInfo.friends.length > 0) {
        userInfo.friends.forEach((friend) => {
          if (friend.status === 4) {
            friends.push(friend.user.toString());
          }
        });
      }
    } catch (error) {
      console.log("Error while fetching friends for socket user");
      console.error(error);
    }

    user = {
      sockets: [socketID],
      friends,
    };
    users.set(userID, user);
  }
  return user;
};

exports.removeSocket = (socketID) => {
  const userID = sockets.get(socketID);
  if (!userID) return undefined;
  sockets.delete(socketID);

  const updateUser = users.get(userID);
  if (!updateUser) return undefined;
  if (updateUser.sockets.length <= 1) {
    users.delete(userID);
    return updateUser;
  } else {
    updateUser.sockets.forEach((socket, index, arr) => {
      if (socket === socketID) {
        arr.splice(index, 1);
      }
    });
    return null;
  }
};

exports.getUserSockets = (userID) => {
  const user = users.get(userID);
  return user;
};

exports.removeUser = (userID) => {
  return users.delete(userID);
};

exports.getOnlineFriends = async (userID) => {
  const onlineFriends = [];
  try {
    const userInfo = await User.findById(userID, "friends");
    if (userInfo.friends.length > 0) {
      userInfo.friends.forEach((friend) => {
        if (friend.status === 4) {
          const friendID = friend.user.toString();
          const isOnline = this.getUserSockets(friendID);
          if (isOnline) {
            onlineFriends.push(friendID);
          }
        }
      });
    }
  } catch (error) {
    console.log("Error while fetching friends for socket user");
    console.log(error);
  }
  return onlineFriends;
};
