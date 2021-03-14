const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");
const redis = require("redis");

//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const { searchTracks, newRelease, topTracks } = require("./src/utils/spotify");
const { infoFromQuery } = require("./src/utils/youtube");
const app = express();
require("dotenv").config();
const client = new MongoClient(process.env.ATLAS_URI);
const port = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL;

const redisCache = redis.createClient(REDIS_URL);

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());

let collection;
app.get("/test", async (req, res) => {
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

app.get("/search", async (req, res) => {
  const query = req.query.query;
  const result = await searchTracks(query);
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

// app.get("/test", (req, res) => {
//   const key = req.query.key;
//   const data = req.query.data;
//   // console.log(query);
//   test(key, data);
// });

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
