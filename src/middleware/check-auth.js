const jwt = require('jsonwebtoken');
const {redisClient, redisKeys } = require('../connect/connectRedis');

module.exports = async (req, res, next) => {
    try {

        const token = (req.headers.authorization) ? req.headers.authorization.split(" ")[1] : "";   

        console.log('State 1');
        
        
        if (!token || token == null || token === "null") {
            console.log('State 2');
            return res.status(401).json({ message: "Unauthorized State 1"});
        } else {

            console.log('State 3');

            jwt.verify(token, process.env.JWT_SECRET, async (err, verifyTokenRes) => {

                console.log('State 4');

                if(err){
                    return res.status(403).json({ message: "Invalid token info"})
                }

                const sessionId = verifyTokenRes?.sessionId;            
                const user = await redisClient.get(`${redisKeys.USER_STATE}:${sessionId}`);
                
                if (!user){
                    console.log('State 5');
                    return res.status(401).json({ message: "Unauthorized State 2"});
                }

                req.userData = JSON.parse(user);
                next();

            });
            
        }
       
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message:  'Authentication failed.',
        });
    }
};