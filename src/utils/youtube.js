const search = require("youtube-search");
const youtube = require("scrape-youtube").default;
const cache = require("../configs/cache");
require("dotenv").config();
const API_KEY = process.env.YOUTUBE_KEY;

const opts = {
  type: "video",
  maxResults: 1,
  videoCategoryId: "10",
  key: API_KEY,
};

const youtubeScrape = async (query) => {
  console.log("Using yt scrape");
  const result = await youtube.search(query);

  if (result) {
    const { id } = result.videos[0];
    const { title } = result.videos[0];
    return {
      id,
      title,
    };
  }
};

const infoFromQuery = async (query) => {
  if (!query) {
    return { response: "No query found" };
  }
  let videoID;

  //if song is not in cahce search it using youtube-search
  try {
    const response = await search(query, opts);
    if (response.results) {
      // console.log(response.results[0]);
      const track = response.results[0];

      //destructure required values from the response
      videoID = { id: track.id, title: track.title };
    }
  } catch (e) {
    console.log("API rate limited");
    console.log(e);

    try {
      videoID = await youtubeScrape(query);
    } catch (error) {
      console.log("Invalid Query/No match found");
    }
  }

  return videoID;
};

module.exports = { infoFromQuery };
