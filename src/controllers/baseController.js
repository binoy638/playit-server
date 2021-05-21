const {
  getArtistInfo,
  getTrackInfo,
  getArtistAlbums,
  getAlbum,
  getArtistTopTracks,
} = require("../utils/spotify");
const { redisCache } = require("../configs/cache");

exports.getArtistByIdController = async (req, res) => {
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
};

exports.getTrackByIdController = async (req, res) => {
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
};

exports.getAlbumByIdController = async (req, res) => {
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
};

exports.getArtistAlbumsController = async (req, res) => {
  try {
    const { id, limit, offset, include_groups } = req.query;
    const result = await getArtistAlbums(id, limit, offset, include_groups);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

exports.getArtistTopTracksController = async (req, res) => {
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
};
