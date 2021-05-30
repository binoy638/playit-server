const mongoose = require("mongoose");
const { ObjectId, Mixed } = mongoose.Schema.Types;

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 32,
    },
    tracks: [Mixed],
    owner: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Playlist", playlistSchema);
