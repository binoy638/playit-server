const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");
const redis = require("redis");

//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const { searchTracks, newRelease, topTracks } = require("./src/utils/spotify");
const { infoFromQuery } = require("./src/utils/youtube");
const { lyrics } = require("./src/utils/lyrics");

require("dotenv").config();
const client = new MongoClient(process.env.ATLAS_URI);
const port = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL;

//creating a redis client
const redisCache = redis.createClient(REDIS_URL);

//creating an express app
const app = express();

//using middlewares
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());

//Keys
//SPT: spotify tracks
//SPP:spotify playlist
//YTID: yt video id

let collection;

//endpoint to get search suggestions
app.get("/autosearch/artist/:name", async (req, res) => {
  try {
    let result = await collection
      .aggregate([
        {
          $search: {
            autocomplete: {
              query: `${req.params.name}`,
              path: "artist",
              fuzzy: {
                maxEdits: 2,
                prefixLength: 3,
              },
            },
          },
        },
        { $sort: { popularity: -1 } },
        {
          $limit: 5,
        },
      ])
      .toArray();

    res.send(result);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

app.get("/autosearch/track/:title", async (req, res) => {
  try {
    let result = await collection
      .aggregate([
        {
          $search: {
            autocomplete: {
              query: `${req.params.title}`,
              path: "name",
            },
          },
        },
        { $sort: { popularity: -1 } },
        {
          $limit: 5,
        },
      ])
      .toArray();

    res.send(result);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

//endpoint to get track search results from spotify
app.get("/search", cache("SPT-"), async (req, res) => {
  const query = req.query.query;
  const result = await searchTracks(query);
  const redisValue = JSON.stringify(result);
  const key = `SPT-${query}`;

  if (key && redisValue) {
    redisCache.setex(key, 86400, redisValue);
  }

  res.send(result);
});

//Cache middleware
function cache(prefix) {
  return (req, res, next) => {
    let query = req.query.query;
    let key;

    if (!query) {
      key = prefix + req.path.slice(1);
    } else {
      key = prefix + query;
    }
    redisCache.get(key, (err, data) => {
      if (err) throw err;

      if (data !== null) {
        console.log(`fetching ${key} from cache`);
        res.send(JSON.parse(data));
      } else {
        next();
      }
    });
  };
}

//endpoint to get new released tracks from spotify
app.get("/new-release", cache("SPP-"), async (req, res) => {
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
});

//endpoint to get most played tracks from spotify
app.get("/top-tracks", cache("SPP-"), async (req, res) => {
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
});

//endpoint to get youtube video id
app.get("/videoid", cache("YTID-"), async (req, res) => {
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
});

app.get("/lyrics/:title/:artist", async (req, res) => {
  const { title, artist } = req.params;

  const result = await lyrics(title, artist);
  // const redisValue = JSON.stringify(result);
  // const key = query;

  // redisCache.setex(key, 86400, redisValue);
  res.send(result);
});

app.listen(port, async () => {
  console.log(`listening at http://localhost:${port}`);
  //connect to mongodb
  try {
    await client.connect({
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    collection = client.db("playit").collection("Tracks");
  } catch (e) {
    console.error(e);
  }
});
