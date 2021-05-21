const axios = require("axios");
const qs = require("qs");
const SpotifyWebApi = require("spotify-web-api-node");
const { redisCache } = require("../configs/cache.js");
const { promisify } = require("util");
const { response } = require("express");
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
  let response = await spotifyApi.searchTracks(query);
  if (response.statusCode === 200) {
    if (response.body.tracks.items.length === 0) {
      return { statusCode: 404 };
    }
    const tracks = response.body.tracks.items;

    let tracklist = [];

    tracks.map((track) => {
      const id = track.id;
      const album = {
        type: track.album.album_type,
        id: track.album.id,
        name: track.album.name,
        release_date: track.album.release_date,
        total_tracks: track.album.total_tracks,
      };

      const artist = track.artists[0].name;
      const artists = track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      }));
      const title = track.name;
      const image = track.album.images[1].url;
      const type = track.type;
      const search_query = `${artist} ${title}`;
      tracklist.push({
        id,
        album,
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

const getTrackInfo = async (id) => {
  await setToken();
  try {
    const response = await spotifyApi.getTrack(id);
    // return response;

    if (response.statusCode === 200) {
      const { id, name, popularity, type, track_number } = response.body;
      const {
        album_type,
        id: album_id,
        images: [{ url }],
        name: album_name,
        release_date,
      } = response.body.album;
      return {
        id,
        name,
        popularity,
        type,
        track_number,
        album: {
          album_type,
          album_id,
          url,
          album_name,
          release_date,
          album_type,
        },
      };
    } else {
      return { statusCode: 404 };
    }
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

const getArtistAlbums = async (id, limit, offset, include_groups) => {
  await setToken();
  try {
    const response = await spotifyApi.getArtistAlbums(id, {
      limit,
      offset,
      include_groups, // album,single,compilation,appears_on
    });
    if (response.statusCode === 200) {
      const items = response.body.items;
      let albums = [];
      items.map((item) => {
        const {
          id,
          name,
          release_date,
          total_tracks,
          images: [{ url }],
        } = item;
        const artists = item.artists.map((i) => ({ id: i.id, name: i.name }));
        albums.push({
          id,
          name,
          release_date,
          total_tracks,
          artists,
          image: url,
        });
      });
      // return response;
      return albums;
    } else {
      return { statusCode: 404 };
    }
  } catch (e) {
    console.log("Something went wrong with get artist albums.");
    console.log(e);
    return { statusCode: 500 };
  }
};

const getAlbum = async (id) => {
  await setToken();
  try {
    const response = await spotifyApi.getAlbum(id);
    if (response.statusCode === 200) {
      const {
        album_type,
        genres,
        id,
        label,
        name,
        popularity,
        images: [{ url }],
        release_date,
        total_tracks,
        type,
      } = response.body;
      const items = response.body.tracks.items;
      let tracks = [];
      items.map((item) => {
        const id = item.id;
        const duration = item.duration_ms / 1000;
        const artist = item.artists[0].name;
        const artists = item.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        }));
        const title = item.name;

        const obj = {
          id,
          artist,
          duration,
          image: url,
          title,
          artists,
          search_query: `${artist} ${title}`,
        };
        tracks.push(obj);
      });
      return {
        album_type,
        genres,
        id,
        tracks,
        label,
        name,
        popularity,
        image: url,
        release_date,
        total_tracks,
        type,
      };
    } else {
      return { statusCode: 404 };
    }
  } catch (error) {
    console.log("Something went wrong with get album.");
    console.log(error);
    return { statusCode: 500 };
  }
};

const searchArtists = async (query) => {
  await setToken();
  try {
    const response = await spotifyApi.searchArtists(query);
    if (response.statusCode === 200) {
      let items = response.body.artists.items;
      let artists = [];
      items.map((item) => {
        const { id, name, type, popularity, genres, images } = item;

        const obj = {
          id,
          name,
          type,
          popularity,
          genres,
          images: images[0] && images[0].url,
        };
        artists.push(obj);
      });
      return artists;
    } else {
      return { statusCode: 404 };
    }
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};

const getArtistTopTracks = async (id) => {
  await setToken();
  try {
    const response = await spotifyApi.getArtistTopTracks(id, "IN");
    if (response.statusCode === 200) {
      let items = response.body.tracks;
      let tracks = [];
      items.map((track) => {
        const id = track.id;
        const album = {
          type: track.album.album_type,
          id: track.album.id,
          name: track.album.name,
          release_date: track.album.release_date,
          total_tracks: track.album.total_tracks,
        };

        const artist = track.artists[0].name;
        const artists = track.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        }));
        const duration = track.duration_ms / 1000;
        const title = track.name;
        const image = track.album.images[1].url;
        const type = track.type;
        const search_query = `${artist} ${title}`;
        tracks.push({
          id,
          album,
          artist,
          title,
          type,
          duration,
          artists,
          image,
          search_query,
        });
      });

      return tracks;
    } else {
      return { statusCode: 404 };
    }
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};

module.exports = {
  getArtistTopTracks,
  searchArtists,
  getAlbum,
  getArtistAlbums,
  searchTracks,
  newRelease,
  topTracks,
  getTrackInfo,
  getArtistInfo,
};
