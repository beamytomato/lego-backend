const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    username: String,
    available_money: Number,
    email: String,
    first_name : String,
    last_name: String,
    legos_sold : Array,
    isSeller : Boolean,
    encryptedUserId: String
})

module.exports = mongoose.model("user", userSchema);