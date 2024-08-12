const mongoose = require("mongoose");

const mongodbURL = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PW}@${process.env.MONGO_DB_CLS}.mongodb.net/${process.env.MONGO_DB}`;
const connectDatabase = () => {
    mongoose.connect(mongodbURL).then((con) => {
        console.log('MongoDB connected to host: '+con.connection.host)
    })
};

module.exports = connectDatabase;