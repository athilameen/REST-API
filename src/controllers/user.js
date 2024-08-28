const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require('joi')
const { generateToken } = require('../utils/common');
const joiValidate = require('../utils/joiValidate')

const User = require("../models/user");
const {redisClient, redisKeys } = require('../connect/connectRedis')

exports.userSignup = async (req, res) => {

    try{

        const schema = Joi.object({
          email: Joi.string().email().required().label("Email"),
          password: Joi.string().required().min(8).label("Password"),        
        });

        const { success: valid, message: error } = await joiValidate(schema, req.body);

        if (!valid){
          return res.status(403).json({message : error});
        }
        
        const isUser = await User.find({ email: req.body.email }).exec();

        if (isUser.length >= 1) {
            return res.status(409).json({
                message: `Email already registered. Please use a different one.`
            });
        } else {
          bcrypt.hash(req.body.password, 10, async (err, hash) => {
           if (err) {
              return res.status(500).json({error: err});
            } else {

              const userData = new User({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash
              });

              try{
                await userData.save();
                res.status(201).json({message : 'User has been successfully created.', success: true});
              } catch(err){
                res.status(500).json({
                  message: 'Internal server error',
                  error: err || 'Something Wrong!'
                });
              }
                  
            }
          });
        }
        
    } catch(err){        
        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });
    }

};

exports.userLogin = async (req, res) => {

  try{

      const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password"),            
      });

      const { success: valid, message: error } = await joiValidate(schema, req.body);

      if (!valid){
        return res.status(403).json({error});
      }
      
      const user = await User.find({ email: req.body.email }).exec();

      if (user.length < 1) {
        return res.status(401).json({
          message: "Authentication failed. Please check your credentials and try again."
        });
      }

      const loginError = await bcrypt.compare(req.body.password, user[0].password);

      if(!loginError){
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      const sessionId = await generateToken({ byteLength: 12 });
        
      const userInfo = {
        sessionId,
        email: user[0].email,
        userId: user[0]._id
      }      

      const accessToken = jwt.sign(
        userInfo,
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
        }
      );

      const refreshToken = jwt.sign(
        userInfo,
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
        }
      );

      const userData = {
        user: userInfo,
        accessToken,
        refreshToken
      }

      //const expiresIn = 60 * 60 * 24 * 30; // 30 days
      const refreshExpiredIn = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN;
      const expiresIn = (refreshExpiredIn + 60 ); // 60 sec extra
      await redisClient.set(`${redisKeys.USER_STATE}:${sessionId}`, JSON.stringify(userInfo), { EX: expiresIn });
      return res.success(userData, 'Login Success ');

  } catch(err){        
      res.status(500).json({
        message: 'Internal server error',
        error: err || 'Something Wrong!'
      });
  }

};

exports.logoutUser = async (req, res) => {
  const sessionId = req?.userData?.sessionId;
  await redisClient.del(`${redisKeys.USER_STATE}:${sessionId}`);
  return res.success({success: true}, 'User logged out successfully');
};

exports.userDelete = async (req, res) => {

  try{

    const userId = req.params.userId;
    const getUser = await User.findById(userId); 
    if(getUser){

      const result = await User.deleteOne({_id: userId });            
      let resultMessage;
      if(result.deletedCount > 0){
        resultMessage = "The user has been successfully deleted."
      } else {
        resultMessage = "Failed to delete the user. Please try again."
      }
       res.success({ message: resultMessage});
        
    } else {
      res.status(404).json({
        error : "The user could not be found or has been removed."
      })
    }
    
  } catch(err){
      res.status(500).json({
        message: 'Internal server error',
        error: err || 'Something Wrong!'
      });
  }

}

exports.refreshToken = async (req, res) => {

  try{

    const schema = Joi.object({
      refreshToken: Joi.string().required().label("Refresh Token"),
    });

    const { success: valid, message: error } = await joiValidate(schema, req.body);

    if (!valid){
      return res.status(403).json({error});
    }
    
    jwt.verify(req.body.refreshToken, process.env.JWT_SECRET, async (err, verifyTokenRes) => {

      if(err){
        return res.status(400).json({ message: 'Token verification failed.'});
      }

      if (verifyTokenRes) {

        const accessToken = jwt.sign(
          {
            sessionId: verifyTokenRes.sessionId,
            email: verifyTokenRes.email,
            userId: verifyTokenRes.userId
          },
          process.env.JWT_SECRET,
          {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
          }
        );
        return res.success({accessToken}, 'Token refreshed successfully');
        
      }

    });
    
    
  } catch(err){
      res.status(500).json({
        message: 'Internal server error',
        error: err || 'Something Wrong!'
      });
  }

}