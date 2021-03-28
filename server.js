const express = require("express");
const { MongoClient } = require("mongodb");

//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

//import Routes
const Searchrouter = require("./src/routes/searchRoute");

require("dotenv").config();
const client = new MongoClient(process.env.ATLAS_URI);
const port = process.env.PORT || 5000;

//creating an express app
const app = express();

//using middlewares
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());

//routes
app.use("/search", Searchrouter);

//404
app.use((req, res) => {
  res.status(404).send({ status: 404 });
});

app.listen(port, async () => {
  console.log(`listening at http://localhost:${port}`);
  //connect to mongodb
  // try {
  //   await client.connect({
  //     useNewUrlParser: true,
  //     useUnifiedTopology: true,
  //     useFindAndModify: false,
  //   });
  //   collection = client.db("playit").collection("Tracks");
  // } catch (e) {
  //   console.error(e);
  // }
});
