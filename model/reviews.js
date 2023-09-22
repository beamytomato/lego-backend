const mongoose = require("mongoose");


const reviewSchema = new mongoose.Schema({
    userID : String,
    description : String,
    legoID : String,
    rating : Number,
    title : String,
    image: String
})


module.exports = mongoose.model("review", reviewSchema);