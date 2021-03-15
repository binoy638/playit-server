const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");
const redis = require("redis");

//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const { searchTracks, newRelease, topTracks } = require("./src/utils/spotify");
const { infoFromQuery } = require("./src/utils/youtube");

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

let collection;

//endpoint to get search suggestions
app.get("/autosearch", async (req, res) => {
  try {
    let result = await collection
      .aggregate([
        {
          $search: {
            autocomplete: {
              query: `${req.query.query}`,
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
      // .find({ name: "Numb" })
      .toArray();

    res.send(result);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

//endpoint to get track search results from spotify
app.get("/search", cache, async (req, res) => {
  const query = req.query.query;
  const result = await searchTracks(query);
  const redisValue = JSON.stringify(result);
  const key = query;

  redisCache.setex(key, 86400, redisValue);
  res.send(result);
});

//Cache middleware
function cache(req, res, next) {
  let key = req.query.query;
  if (!key) {
    key = req.path.slice(1);
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
}

//endpoint to get new released tracks from spotify
app.get("/new-release", cache, async (req, res) => {
  try {
    const result = await newRelease();

    const redisValue = JSON.stringify(result);

    const key = req.path.slice(1);

    redisCache.setex(key, 86400, redisValue);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

//endpoint to get most played tracks from spotify
app.get("/top-tracks", cache, async (req, res) => {
  try {
    const result = await topTracks();
    const redisValue = JSON.stringify(result);
    const key = req.path.slice(1);

    redisCache.setex(key, 86400, redisValue);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

//endpoint to get youtube video id
app.get("/videoid", cache, async (req, res) => {
  try {
    const query = req.query.query;

    const result = await infoFromQuery(query);
    const redisValue = JSON.stringify(result);
    const key = query;

    redisCache.set(key, redisValue);
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
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
