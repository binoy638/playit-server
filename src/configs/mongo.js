const mongoose = require("mongoose");

const connectDB = () => {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === "test") {
      (async () => {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        mongoose
          .connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
          })
          .then((res, err) => {
            if (err) return reject(err);
            resolve();
          });
      })();
    } else {
      mongoose
        .connect(process.env.ATLAS_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useCreateIndex: true,
          useFindAndModify: false,
        })
        .then((res, err) => {
          if (err) return reject(err);
          console.log("connected to mongodb");
          resolve();
        });
    }
  });
};

const closeDB = () => {
  return mongoose.disconnect();
};

module.exports = { connectDB, closeDB };

// module.exports = () => {
//   mongoose.connect(process.env.ATLAS_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//   });
//   const db = mongoose.connection;

//   db.on("error", () => console.log("MongoDB connection error:"));

//   db.on("connected", () => console.log("MongoDB connected"));

//   db.on("disconnected", () => console.log("MongoDB disconnected"));

//   db.on("close", () => console.log("MongoDB connection closed"));
// };
