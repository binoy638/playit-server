const express = require("express");
const {
  searchTracksController,
  searchNewReleaseController,
  searchTopTracksController,
  searchVideoIdController,
  searchArtistsController,
  searchLyrcisController,
} = require("../controllers/searchController");
const { cache } = require("../middlewares/cache");

const router = express.Router();

//Keys Prefix
//SPT: spotify tracks
//SPP:spotify playlist
//YTID: yt video id
//SPA: spotify artist
//SPID: spotify track id
//SAID: spotify album ID
//SATT: spotify artist top tracks

//key types
//1 = path
//2 = query
//3 = param

router.get("/track", cache("SPT-", 2), searchTracksController);

router.get("/new-release", cache("SPP-", 1), searchNewReleaseController);

router.get("/top-tracks", cache("SPP-", 1), searchTopTracksController);

router.get("/videoid", cache("YTID-", 2), searchVideoIdController);

router.get("/artist", searchArtistsController);

router.get("/lyrics/:title/:artist", cache("LRI-", 3), searchLyrcisController);

module.exports = router;
