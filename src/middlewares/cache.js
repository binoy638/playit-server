const { redisCache } = require("../configs/cache");

//key types
//1 = path
//2 = query
//3 = param

const cache = (prefix, type) => {
  return (req, res, next) => {
    let key;
    if (type === 1) {
      key = prefix + req.path.slice(1);
    } else if (type === 2) {
      key = prefix + req.query.query;
    } else if (type === 3) {
      const valArr = Object.values(req.params);
      const suffix = valArr.join("-");
      key = prefix + suffix;
    } else if (type === 4) {
      const { name } = req.body;
      if (!name) throw new Error("No name arg found in the request body.");
      key = prefix + name;
    } else {
      throw new Error("Invalid cache key type");
    }
    redisCache.get(key, (err, data) => {
      if (err) throw err;

      if (data !== null) {
        // console.log(`fetching ${key} from cache`);
        res.send(JSON.parse(data));
      } else {
        next();
      }
    });
  };
};

module.exports = { cache };
