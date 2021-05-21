const { redisCache } = require("../configs/cache");
const { lyrics } = require("../utils/lyrics");
const {
  searchTracks,
  newRelease,
  topTracks,
  searchArtists,
} = require("../utils/spotify");
const { infoFromQuery } = require("../utils/youtube");

exports.searchTracksController = async (req, res) => {
  const query = req.query.query;
  const result = await searchTracks(query);
  const redisValue = JSON.stringify(result);
  const key = `SPT-${query}`;

  if (key && redisValue) {
    redisCache.setex(key, 86400, redisValue);
  }

  res.send(result);
};

exports.searchNewReleaseController = async (req, res) => {
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
};

exports.searchTopTracksController = async (req, res) => {
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
};

exports.searchVideoIdController = async (req, res) => {
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
};

exports.searchArtistsController = async (req, res) => {
  try {
    const { query } = req.query;
    const result = await searchArtists(query);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
};

exports.searchLyrcisController = async (req, res) => {
  try {
    const { title, artist } = req.params;
    const result = await lyrics(title, artist);
    const redisValue = JSON.stringify(result);
    const key = `LRI-${title}-${artist}`;

    if (key && redisValue) {
      redisCache.set(key, redisValue);
    }
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
};
