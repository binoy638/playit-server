const mongoose = require("mongoose");

module.exports = () => {
  mongoose.connect(process.env.ATLAS_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  const db = mongoose.connection;

  db.on("error", () => console.log("MongoDB connection error:"));

  db.on("connected", () => console.log("MongoDB connected"));

  db.on("disconnected", () => console.log("MongoDB disconnected"));

  db.on("close", () => console.log("MongoDB connection closed"));
};
