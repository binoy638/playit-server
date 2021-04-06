const express = require("express");

//middlewares
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

//import Routes
const Searchrouter = require("./src/routes/searchRoute");
const Getrouter = require("./src/routes/getRoute");

require("dotenv").config();
const port = process.env.PORT || 5000;

//creating an express app
const app = express();

//using middlewares
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());

//routes
app.use("/search", Searchrouter);
app.use(Getrouter);

//404
app.use((req, res) => {
  res.status(404).send({ status: 404 });
});

let routes = [];
exports.routes = routes;

app.listen(port, async () => {
  console.log(`listening at http://localhost:${port}`);
  let route;
  app._router.stack.forEach(function (middleware) {
    if (middleware.route) {
      routes.push(middleware.route);
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach(function (handler) {
        route = handler.route.path;
        route && routes.push(route);
      });
    }
  });
});
