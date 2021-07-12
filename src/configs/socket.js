const socket = require("socket.io");
module.exports = (server) => {
  return socket(server, {
    cors: true,
    origins: ["*"],
  });
};
