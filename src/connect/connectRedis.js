const { createClient } = require("redis");
const session = require("express-session");
const RedisStore = require("connect-redis").default

const redisClient = createClient({
    password: process.env.REDIS_PW,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.connect().catch((error) => {
    console.log(error);
});

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: `${process.env.JWT_SECRET}`,
    resave: false,
    saveUninitialized: false
});

var redisKeys;

(function(redisKeys) {
  redisKeys["USER_STATE"] = "userState"
})(redisKeys || (redisKeys = {}))

module.exports = { redisClient, sessionMiddleware, redisKeys };