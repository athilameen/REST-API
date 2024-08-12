const express = require('express')
const route = require('./route')
const dotenv = require('dotenv')
dotenv.config();

const responseMiddleware = require('./middleware/responseMiddleware');
const connectDatabase = require('./connect/connectDatabase');
const { sessionMiddleware } = require('./connect/connectRedis');

connectDatabase();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(responseMiddleware);
app.use(sessionMiddleware);

//Cross-site scripting
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
    }
    next();
});

app.use("/api", route);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});
  
app.use((error, req, res) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message
      }
    });
});
  
module.exports = app;