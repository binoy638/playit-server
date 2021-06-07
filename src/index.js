const express = require("express");
const socket = require("socket.io");
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
const userRouter = require("./routes/userRouter");

const port = process.env.PORT || 5001;

//creating an express app
const app = express();

// const server = http.createServer(app);

//using middlewares
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded());

//routes
app.use("/search", searchRouter);
app.use("/auth", authRouter);
app.use("/playlist", playlistRouter);
app.use("/user", userRouter);

// app.use("/library", libraryRouter);
app.use(baseRouter);

//404
app.use((req, res) => {
  res.status(404).send({ status: 404 });
});

const server = app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});

const io = socket(server, {
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
  socket.on("disconnect", () => {
    console.log("disconnected ", socket.id);
  });
});
