const express = require("express");
const routes = require("../../server");
const {
  getArtistByIdController,
  getTrackByIdController,
  getAlbumByIdController,
  getArtistAlbumsController,
  getArtistTopTracksController,
} = require("../controllers/baseController");
const { cache } = require("../middlewares/cache");

const router = express.Router();

router.get("/", (req, res) => {
  res.send(routes);
});

router.get("/artist/:id", cache("SPA-", 3), getArtistByIdController);

router.get("/track/:id", cache("SPID-", 3), getTrackByIdController);

router.get("/album/:id", cache("SAID-", 3), getAlbumByIdController);

router.get("/artist-albums", getArtistAlbumsController);

router.get(
  "/artist-toptracks/:id",
  cache("SATT-", 3),
  getArtistTopTracksController
);

module.exports = router;
