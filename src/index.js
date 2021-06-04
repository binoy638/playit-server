const express = require("express");
const socketio = require("socket.io");
// const http = require("http");
require("dotenv").config();
require("./configs/mongo")();
//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

//import Routes
const searchRouter = require("./routes/searchRouter");
const baseRouter = require("./routes/baseRouter");
const authRouter = require("./routes/authRouter");
const playlistRouter = require("./routes/playlistRouter");
// const libraryRouter = require("./routes/libraryRouter");

const port = process.env.PORT || 7789;

//creating an express app
const app = express();

// const server = http.createServer(app);

//using middlewares
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
// app.use(express.urlencoded());

//routes
app.use("/search", searchRouter);
app.use("/auth", authRouter);
app.use("/playlist", playlistRouter);

// app.use("/library", libraryRouter);
app.use(baseRouter);

//404
app.use((req, res) => {
  res.status(404).send({ status: 404 });
});

let routes = [];
exports.routes = routes;

const server = app.listen(port, async () => {
  console.log(`listening at http://localhost:${port}`);
  let route;
  app._router.stack.forEach(function (middleware) {
    if (middleware.route) {
      routes.push(middleware.route);
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach(function (handler) {
        route = handler.route.path;
        route && routes.push(route);
      });
    }
  });
});

const io = socketio(server, {
  cors: true,
  origins: ["*"],
});

io.on("connection", (socket) => {
  console.log(socket.id);
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
});
