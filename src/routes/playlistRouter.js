const express = require("express");
const router = express.Router();

const Controller = require("../controllers/playlistController");
const verifyToken = require("../middlewares/verifyToken");

router.get("/add-track", Controller.addTrack);

router.post("/create", verifyToken, Controller.create);

router.get("/", verifyToken, (req, res) =>
  res.send({ playlist: ["zyx", "abc"] })
);

module.exports = router;
