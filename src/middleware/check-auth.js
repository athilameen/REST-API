const jwt = require('jsonwebtoken');
const {redisClient, redisKeys } = require('../connect/connectRedis');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];        

        if (!token || token == null || token === "null") {
            return res.status(401).json({ message: "Unauthorized"});
        } else {

            jwt.verify(token, process.env.JWT_SECRET, async (err, verifyTokenRes) => {

                if(err){
                    return res.status(403).json({ message: "Invalid token info"})
                }

                const sessionId = verifyTokenRes?.sessionId;            
                const user = await redisClient.get(`${redisKeys.USER_STATE}:${sessionId}`);
                
                if (!user){
                    return res.status(401).json({ message: "Unauthorized"});
                }

                req.userData = JSON.parse(user);
                next();

            });
            
        }
       
    } catch (error) {
        return res.status(401).json({
            message: (Object.keys(error.response.data.message).length === 0) ?  'Authentication failed.' : error.response.data.message,
        });
    }
};