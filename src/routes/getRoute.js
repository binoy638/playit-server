const express = require("express");
const routes = require("../../server");
const { cache } = require("../middlewares/cache");
const { redisCache } = require("../utils/cache");
const {
  getArtistInfo,
  getTrackInfo,
  getArtistAlbums,
  getAlbum,
  getArtistTopTracks,
} = require("../utils/spotify");

const router = express.Router();

router.get("/", (req, res) => {
  res.send(routes);
});

router.get("/artist/:id", cache("SPA-", 3), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getArtistInfo(id);
    const redisValue = JSON.stringify(result);
    const key = `SPA-${id}`;

    if (key && redisValue) {
      redisCache.set(key, redisValue);
    }
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

router.get("/track/:id", cache("SPID-", 3), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getTrackInfo(id);
    const redisValue = JSON.stringify(result);
    const key = `SPID-${id}`;

    if (key && redisValue) {
      redisCache.set(key, redisValue);
    }
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

router.get("/album/:id", cache("SAID-", 3), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getAlbum(id);
    const redisValue = JSON.stringify(result);
    const key = `SAID-${id}`;

    if (key && redisValue) {
      redisCache.set(key, redisValue);
    }
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

router.get("/artist-albums", async (req, res) => {
  try {
    const { id, limit, offset, include_groups } = req.query;
    const result = await getArtistAlbums(id, limit, offset, include_groups);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

router.get("/artist-toptracks/:id", cache("SATT-", 3), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getArtistTopTracks(id);
    const redisValue = JSON.stringify(result);
    const key = `SATT-${id}`;

    if (key && redisValue) {
      redisCache.setex(key, 86400, redisValue);
    }
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
});

module.exports = router;
