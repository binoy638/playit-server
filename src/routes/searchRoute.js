const express = require("express");
const { cache } = require("../middlewares/cache");
const { redisCache } = require("../utils/cache");
const { lyrics } = require("../utils/lyrics");
const {
  searchTracks,
  newRelease,
  topTracks,
  getTrackInfo,
  getArtistInfo,
} = require("../utils/spotify");
const { infoFromQuery } = require("../utils/youtube");
const router = express.Router();

//Keys
//SPT: spotify tracks
//SPP:spotify playlist
//YTID: yt video id
//SPA: spotify artist

//key types
//1 = path
//2 = query
//3 = param

//endpoint to get track search results from spotify
router.get("/track", cache("SPT-", 2), async (req, res) => {
  const query = req.query.query;
  const result = await searchTracks(query);
  const redisValue = JSON.stringify(result);
  const key = `SPT-${query}`;

  if (key && redisValue) {
    redisCache.setex(key, 86400, redisValue);
  }

  res.send(result);
});

//Cache middleware

//endpoint to get new released tracks from spotify
router.get("/new-release", cache("SPP-", 1), async (req, res) => {
  try {
    const result = await newRelease();

    const redisValue = JSON.stringify(result);

    const key = `SPP-${req.path.slice(1)}`;

    if (key && redisValue) {
      redisCache.setex(key, 86400, redisValue);
    }

    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

//endpoint to get most played tracks from spotify
router.get("/top-tracks", cache("SPP-", 1), async (req, res) => {
  try {
    const result = await topTracks();
    const redisValue = JSON.stringify(result);
    const key = `SPP-${req.path.slice(1)}`;

    if (key && redisValue) {
      redisCache.setex(key, 86400, redisValue);
    }

    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

//endpoint to get youtube video id
router.get("/videoid", cache("YTID-", 2), async (req, res) => {
  try {
    const query = req.query.query;

    const result = await infoFromQuery(query);
    const redisValue = JSON.stringify(result);
    const key = `YTID-${query}`;

    if (key && redisValue) {
      redisCache.set(key, redisValue);
    }
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

router.get("/lyrics/:title/:artist", cache("LRI-", 3), async (req, res) => {
  const { title, artist } = req.params;
  const result = await lyrics(title, artist);
  const redisValue = JSON.stringify(result);
  const key = `LRI-${title}-${artist}`;

  if (key && redisValue) {
    redisCache.set(key, redisValue);
  }
  res.send(result);
});

router.get("/trackID", async (req, res) => {
  const result = await getTrackInfo();
  res.send(result);
});

router.get("/artist/:id", cache("SPA-", 3), async (req, res) => {
  const { id } = req.params;
  const result = await getArtistInfo(id);
  const redisValue = JSON.stringify(result);
  const key = `SPA-${id}`;

  if (key && redisValue) {
    redisCache.set(key, redisValue);
  }
  res.send(result);
});

module.exports = router;
