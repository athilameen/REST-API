const mongoose = require("mongoose");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require('joi')
const { generateToken } = require('../utils/common');
const joiValidate = require('../utils/joiValidate')

const User = require("../models/user");
const {redisClient, redisKeys } = require('../connect/connectRedis');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.userSignup = async (req, res) => {

    try{

        const schema = Joi.object({
          firstName: Joi.string().required().label("First Name"),
          lastName: Joi.string().required().label("Last Name"),
          countryCode: Joi.string().label("Country Code"),
          mobileINumber: Joi.string().required().label("Mobile Number"),
          mobileNumber: Joi.string().required().label("Mobile Number"),
          email: Joi.string().email().required().label("Email"),
          password: Joi.string().required().min(8).label("Password"),        
        });

        const { success: valid, message: error } = await joiValidate(schema, req.body);

        if (!valid){
          return res.status(403).json({message : error});
        }
        
        // Check if the email or mobile number already exists
        const existingUser = await User.findOne({
          $or: [{ email: req.body.email }, { mobileINumber: req.body.mobileINumber }],
        });

        if (existingUser) {
          return res.status(409).json({ 
            message: 'Email or Mobile number already exists' 
          });
        }  else {
          bcrypt.hash(req.body.password, 10, async (err, hash) => {
           if (err) {
              return res.status(500).json({error: err});
            } else {

              const userData = new User({
                _id: new mongoose.Types.ObjectId(),
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                countryCode: req.body.countryCode,
                mobileINumber: req.body.mobileINumber,
                mobileNumber: req.body.mobileNumber,
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

      let schema;
      if (validateEmail(req.body.identifier)) {
        req.body.email = req.body.identifier;
        schema = Joi.object({
          email: Joi.string().email().required().label("Email"),
          password: Joi.string().required().label("Password"),            
        });
      } else {
        req.body.mobileNumber = req.body.identifier;
        schema = Joi.object({
          mobileNumber: Joi.string().required().label("Mobile Number"),
          password: Joi.string().required().label("Password"),            
        });
      }

      delete req.body.identifier;
      
      const { success: valid, message: error } = await joiValidate(schema, req.body);

      if (!valid){
        return res.status(403).json({error});
      }
      
      let user;
      if(req.body?.mobileNumber){
        user = await User.findOne({
          $or: [{ mobileINumber: req.body.mobileNumber }, { mobileNumber: req.body.mobileNumber }],
        });

        if(!user){
          const alterNumber = "+"+req.body.mobileNumber;
          user = await User.findOne({ mobileINumber: alterNumber }).exec();
        }
      } else {
        user = await User.findOne({ email: req.body.email }).exec();
      }
          
      if (!user) {
        return res.status(401).json({
          message: "Authentication failed. Please check your credentials and try again."
        });
      }

      const loginError = await bcrypt.compare(req.body.password, user.password);

      if(!loginError){
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      const sessionId = await generateToken({ byteLength: 12 });
        
      const userInfo = {
        sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        countryCode: user.countryCode,
        mobileINumber: user.mobileINumber,
        mobileNumber: user.mobileNumber,
        email: user.email,
        userId: user._id
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

      const expiresIn = process.env.REDIS_EXPIRES_IN; // 60 sec extra of Refresh token time
      await redisClient.set(`${redisKeys.USER_STATE}:${sessionId}`, JSON.stringify(userInfo), { EX: expiresIn });
      return res.success(userData, 'Login Success');
      
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

exports.updateProfile = async(req, res) => {

  try {

    const schema = Joi.object({
      firstName: Joi.string().required().label("First Name"),
      lastName: Joi.string().required().label("Last Name"),
      countryCode: Joi.string().label("Country Code"),
      mobileINumber: Joi.string().required().label("Mobile Number"),
      mobileNumber: Joi.string().required().label("Mobile Number"),  
    });

    const { success: valid, message: error } = await joiValidate(schema, req.body);

    if (!valid){
      return res.status(403).json({message : error});
    }
   
    const userID = req?.userData?.userId;
    const userData = await User.findById(userID);    
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    userData.firstName = req.body.firstName,
    userData.lastName = req.body.lastName,
    userData.countryCode = req.body.countryCode,
    userData.mobileINumber = req.body.mobileINumber,
    userData.mobileNumber = req.body.mobileNumber,
    await userData.save();
    res.success({message : 'Profile updated successfully', success: true});
    
  } catch(err){
    res.status(500).json({
      message: 'Internal server error',
      error: err || 'Something Wrong!'
    });
  }

}

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

exports.changePassword  = async (req, res) => {

  try {

    const { currentPassword, newPassword } = req.body;
   
    const userID = req?.userData?.userId;
    const userData = await User.findById(userID);    
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    bcrypt.hash(newPassword, 10, async (err, hash) => {
      if (err) {
         return res.status(500).json({error: err});
       } else {

        try{
          userData.password = hash;
          await userData.save();
          res.success({message : 'Password changed successfully', success: true});
        } catch(err){
          res.status(500).json({
            message: 'Internal server error',
            error: err || 'Something Wrong!'
          });
        }
             
      }
    });

  } catch(err){
    res.status(500).json({
      message: 'Internal server error',
      error: err || 'Something Wrong!'
    });
  }

}

exports.forgotPassword = async (req, res) => {

  const { email } = req.body;

  try{

    const user = await User.findOne({ email });    

    if (!user) {
      return res.status(400).send({ message: 'User with given email does not exist'});
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + process.env.RESET_PASSWORD_EXPIRES_IN; // 1 hour
    await user.save();
  
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASS,
      },
    });    
    
    const mailOptions = {
      to: user.email,
      from: process.env.MAIL_FROM,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
             Please click on the following link, or paste this into your browser to complete the process:\n\n
             ${process.env.APP_URL}/../ResetPassword/${token}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('There was an error sending the email', err);
        return res.status(500).json({
          message: 'Error sending email',
          error: err || 'Something Wrong!'
        });
      }
      res.success({message: 'Recovery email sent'});
    });
    
  } catch(err){
      res.status(500).json({
        message: 'Internal server error',
        error: err || 'Something Wrong!'
      });
  }

}

exports.resetPassword = async (req, res) => {

  try {

    const schema = Joi.object({
      password: Joi.string().required().min(8).label("Password"),        
    });

    const { success: valid, message: error } = await joiValidate(schema, req.body);

    if (!valid){
      return res.status(403).json({message : error});
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send({ message: 'Password reset token is invalid or has expired'});
    } else {

      bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
           return res.status(500).json({error: err});
         } else {

           try{
              user.password = hash;
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
              await user.save();
              res.success({message: 'Password has been updated'});
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

}