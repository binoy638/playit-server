const { playlistValidation } = require("../validators/playlistValidator");
const User = require("../models/user");
const Playlist = require("../models/playlist");

exports.show = async (req, res) => {
  res.send({ playlist: ["abc", "xyz"] });
};

exports.create = async (req, res) => {
  const { error } = playlistValidation(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  const { name, tracks, email } = req.body;

  const owner = await User.findOne({ email });

  const playlist = new Playlist({
    name,
    tracks,
    owner,
  });
  try {
    const _playlist = await playlist.save();
    res.status(201).send({ _playlist });
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.addTrack = async (req, res) => {
  const { id, track } = req.body;

  const playlist = await Playlist.findById(id).exec();

  console.log(playlist);
};
