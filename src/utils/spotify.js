const axios = require("axios");
const qs = require("qs");
const SpotifyWebApi = require("spotify-web-api-node");
const { redisCache } = require("./cache.js");
const { promisify } = require("util");
const getAsync = promisify(redisCache.get).bind(redisCache);
const spotifyApi = new SpotifyWebApi();

const token = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const headers = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    auth: {
      username: clientId,
      password: clientSecret,
    },
  };
  const data = {
    grant_type: "client_credentials",
  };

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify(data),
      headers
    );
    // console.log(response.data);
    const token = response.data.access_token;
    const expires_in = response.data.expires_in;
    return { token, expires_in };
  } catch (error) {
    console.log(error);
  }
};

const setToken = async () => {
  const key = "ACCESS_TOKEN";
  let accessToken = await getAsync(key);
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  } else {
    const result = await token();
    if (!result) {
      return null;
    }
    accessToken = result.token;
    const ttl = result.expires_in;
    redisCache.setex(key, ttl, accessToken);
    spotifyApi.setAccessToken(accessToken);
  }
};

const searchTracks = async (query) => {
  await setToken();
  response = await spotifyApi.searchTracks(query);
  if (response.statusCode === 200) {
    if (response.body.tracks.items.length === 0) {
      return { statusCode: 404 };
    }
    const tracks = response.body.tracks.items;

    let tracklist = [];

    tracks.map((track) => {
      const id = track.id;
      const artist = track.artists[0].name;
      const artists = track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      }));
      const title = track.name;
      const image = track.album.images[1].url;
      const type = track.album.album_type;
      const search_query = `${artist} ${title}`;
      tracklist.push({
        id,
        artist,
        title,
        type,
        artists,
        image,
        search_query,
      });
    });

    return tracklist;
  }
  return { statusCode: 500 };
};

const newRelease = async () => {
  await setToken();
  try {
    const response = await spotifyApi.getNewReleases({
      limit: 50,
      offset: 0,
    });

    const tracks = response.body.albums.items;

    let tracklist = [];

    tracks.map((track) => {
      const id = track.id;
      const artist = track.artists[0].name;
      const artists = track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      }));
      const type = track.album_type;
      const title = track.name;
      const image = track.images[1].url;
      const search_query = `${artist} ${title}`;
      tracklist.push({
        id,
        artist,
        artists,
        type,
        title,
        image,
        search_query,
      });
    });

    return tracklist;
  } catch (e) {
    console.log("Something went wrong with new release fetch.");
    console.log(e);
    return { statusCode: 500 };
  }
};

const topTracks = async () => {
  await setToken();
  try {
    const response = await spotifyApi.getPlaylist("37i9dQZEVXbMDoHDwVN2tF");

    const items = response.body.tracks.items;

    let tracks = [];

    items.map((item) => {
      const id = item.track.id;
      const artist = item.track.artists[0].name;
      const artists = item.track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      }));
      const type = item.track.album.album_type;
      const image = item.track.album.images[1].url;
      const title = item.track.name;

      const obj = {
        id,
        artist,
        title,
        type,
        image,
        artists,
        search_query: `${artist} ${title}`,
      };
      tracks.push(obj);
    });
    return tracks;
  } catch (e) {
    console.log("Something went wrong with topTracks fetch.");
    console.log(e);
    return { statusCode: 500 };
  }
};

const getTrackInfo = async () => {
  await setToken();
  try {
    const response = await spotifyApi.getTrack("2K0r5GD5zYlEMx2M7ZMcqG");
    return response;

    // const items = response.body.tracks.items;

    // let tracks = [];

    // items.map((item) => {
    //   const id = item.track.id;
    //   const artist = item.track.artists[0].name;
    //   const artists = item.track.artists.map((artist) => ({
    //     id: artist.id,
    //     name: artist.name,
    //   }));
    //   const type = item.track.album.album_type;
    //   const image = item.track.album.images[1].url;
    //   const title = item.track.name;

    //   const obj = {
    //     id,
    //     artist,
    //     title,
    //     type,
    //     image,
    //     artists,
    //     search_query: `${artist} ${title}`,
    //   };
    //   tracks.push(obj);
    // });
    // return tracks;
  } catch (e) {
    console.log("Something went wrong with get track info.");
    console.log(e);
    return { statusCode: 500 };
  }
};

const getArtistInfo = async (id) => {
  await setToken();
  try {
    const response = await spotifyApi.getArtist(id);

    if (response.statusCode === 200) {
      const { id, name, type, genres, popularity, images } = response.body;
      return { id, name, type, genres, popularity, images };
    } else {
      return { statusCode: 404 };
    }
  } catch (e) {
    console.log("Something went wrong with get track info.");
    console.log(e);
    return { statusCode: 500 };
  }
};

module.exports = {
  searchTracks,
  newRelease,
  topTracks,
  getTrackInfo,
  getArtistInfo,
};
