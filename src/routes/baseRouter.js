const express = require("express");
const {
  getArtistByIdController,
  getTrackByIdController,
  getAlbumByIdController,
  getArtistAlbumsController,
  getArtistTopTracksController,
  getNewReleaseController,
  getTopTracksController,
} = require("../controllers/baseController");
const { cache } = require("../middlewares/cache");

const router = express.Router();

router.get("/", (req, res) => {
  res.send({ status: "ready" });
});

router.get("/artist/:id", cache("SPA-", 3), getArtistByIdController);

router.get("/track/:id", cache("SPID-", 3), getTrackByIdController);

router.get("/album/:id", cache("SAID-", 3), getAlbumByIdController);

router.get("/new-release", cache("SPP-", 1), getNewReleaseController);

router.get("/top-tracks", cache("SPP-", 1), getTopTracksController);

router.get("/artist-albums", getArtistAlbumsController);

router.get(
  "/artist-toptracks/:id",
  cache("SATT-", 3),
  getArtistTopTracksController
);

module.exports = router;
