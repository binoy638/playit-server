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
  const { id } = req.params;
  const result = await getArtistInfo(id);
  const redisValue = JSON.stringify(result);
  const key = `SPA-${id}`;

  if (key && redisValue) {
    redisCache.set(key, redisValue);
  }
  res.send(result);
});

router.get("/track/:id", cache("SPID-", 3), async (req, res) => {
  const { id } = req.params;
  const result = await getTrackInfo(id);
  const redisValue = JSON.stringify(result);
  const key = `SPID-${id}`;

  if (key && redisValue) {
    redisCache.set(key, redisValue);
  }
  res.send(result);
});

router.get("/album/:id", async (req, res) => {
  const { id } = req.params;
  const result = await getAlbum(id);
  res.send(result);
});

router.get("/artist-albums", async (req, res) => {
  const { id, limit, offset, include_groups } = req.query;
  const result = await getArtistAlbums(id, limit, offset, include_groups);
  res.send(result);
});

router.get("/artist-toptracks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await getArtistTopTracks(id);
  res.send(result);
});

module.exports = router;
