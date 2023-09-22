const mongoose = require("mongoose");


const purchaseSchema = new mongoose.Schema({
    legoID: String,
    purchaseDate: String,
    tax: Number,
    total: Number,
    userId: String
})

module.exports = mongoose.model("purchase", purchaseSchema);