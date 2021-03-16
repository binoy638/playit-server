const { getLyrics } = require("genius-lyrics-api");
require("dotenv").config();
const GENIUS_KEY = process.env.GENIUS_KEY;

const lyrics = async (title, artist) => {
  const options = {
    apiKey: GENIUS_KEY,
    title,
    artist,
    optimizeQuery: true,
  };

  try {
    const lyrics = getLyrics(options);
    if (lyrics) {
      return lyrics;
    } else {
      return undefined;
    }
  } catch (e) {
    return e;
  }
};

module.exports = { lyrics };
