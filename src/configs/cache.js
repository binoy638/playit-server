const redis = require("redis");
const REDIS_URL = process.env.REDIS_URL;
const redisCache = redis.createClient(REDIS_URL);

redisCache.on("error", function (err) {
  console.log("Error " + err);
});

module.exports = { redisCache };
