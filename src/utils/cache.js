const cache = require("node-cache");

module.exports = (function () {
  this.storage = new cache();
  // this.storage.on("set", function (key, value) {
  //   console.log(`key:${key} value:${value}`);
  // });
  // this.storage.on("expired", function (key, value) {
  //   console.log(`${key} expired`);
  // });

  this.storage.on("set", function (key, value) {
    // console.log(this.storage);
  });
  return this.storage;
})();
