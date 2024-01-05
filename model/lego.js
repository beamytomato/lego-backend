const { Double } = require("mongodb");
const mongoose = require("mongoose");


const legoSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    rating: Number,
    imageURL: String,
    model: String,
    user_seller_id : String,
    category : String
})

module.exports = mongoose.model("lego", legoSchema);





// "name": String,
// "description": String,
// "price": Number,
// "rating": Number,
// "imageURL": String,
// "reviews": Array,
// "model": String