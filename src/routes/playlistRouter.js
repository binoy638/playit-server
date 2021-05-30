const express = require("express");
const router = express.Router();

const Controller = require("../controllers/playlistController");
const verifyToken = require("../middlewares/verifyToken");

router.get("/add-track", Controller.addTrack);

router.post("/create", verifyToken, Controller.create);

// router.post("/create", verifyToken, createPlaylistController);

module.exports = router;
