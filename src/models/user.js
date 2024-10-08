const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: {
        type: String, 
        required: true, 
    },
    lastName: {
        type: String, 
        required: true, 
    },
    countryCode: {
        type: String,
    },
    mobileINumber: {
        type: String, 
        required: true,
        unique: true,
    },
    mobileNumber: {
        type: String, 
        required: true,
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    },
    password: {
        type: String, 
        required: true, 
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date, 
    } 
});

module.exports = mongoose.model('User', userSchema);