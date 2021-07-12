const { redisCache } = require("../configs/cache");
const { lyrics } = require("../utils/lyrics");
const { searchTracks, searchArtists } = require("../utils/spotify");
const { infoFromQuery } = require("../utils/youtube");
const User = require("../models/user");

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

exports.searchUserController = async (req, res) => {
  const { user: searcher } = req;

  try {
    const { query } = req.query;

    //query to find user matching the search term and filter the user who performed the search
    const user = await User.findOne({
      $and: [{ username: query }, { _id: { $ne: searcher._id } }],
    });

    if (user)
      return res.send({
        _id: user._id,
        username: user.username,
        image: user?.image?.url
          ? user.image.url
          : "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png",
      });

    return res.status(404).send({});
  } catch (error) {
    console.error(error);
    res.status(404).send({});
  }
};
