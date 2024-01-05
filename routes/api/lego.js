const express = require ('express');
const router = express.Router();
const User = require("../../model/user");
const Lego = require("../../model/lego")
const Purchase = require("../../model/purchase");
const Review = require("../../model/reviews");
const res = require('express/lib/response');
const ObjectId = require('mongodb').ObjectId;
const axios = require("axios");
const lego = require('../../model/lego');
const CryptoJS = require('crypto-js')
const jwt = require('jsonwebtoken')
const {handleError, encryptData, verifyToken, sortAllLegosByRating} = require('../../utils/authUtils')


const SECRET_KEY = process.env.SERVER_SECRET_KEY

router.post('/register/user', async (req, res) => {
    console.log("Is getting called");
    const existingUser = await User.findOne({email : req.body.email})
    if (existingUser) {
        console.log("user exists")
        return res.status(400).send({});
    } else {
        try{
            const newUser = new User(req.body);
            const newUserObjStrId = newUser._id.toString();

            const encryptedObjectId = CryptoJS.AES.encrypt(newUserObjStrId, SECRET_KEY).toString()
            newUser.encryptedUserId = encryptedObjectId

            console.log(SECRET_KEY);
            const token = jwt.sign(newUser.toJSON(), SECRET_KEY, { expiresIn: '1h'});
            res.cookie('accessToken', token, { httpOnly: true, sameSite: 'Lax'});
            res.cookies.accessToken = token;
            req.user = newUser.toJSON();
            newUser.save().catch(err => console.log(err));
            return res.status(200).send(newUser);
        }
        catch (error) {
            console.log(error);
            handleError(error, res);
        }
    }
})

router.get('/fetch/user/:userID', async (req, res) => {
    try {
        console.log("id input: ", req.params.userID);
        const userObjId = ObjectId(req.params.userID)
        console.log("userObjId: ", userObjId);
    
    
        const user = await User.findById(userObjId);
    
        if(user){
            return res.status(200).send(user);
        }
        else{
            return res.status(404).send({});
        }    
    } catch(error) {
        console.log(error);
        return res.status(400).send({})
    }
})

router.get('/fetch/user/by/email/:email', async (req, res) => {
    try {
        const email = req.params.email;

        if (!email || !email.includes('@')) {
            return res.status(400).send({error: 'Invalid email format'})
        }
    
        const user = await User.findOne({email : email});

        if(user){
            const userData = user.toJSON();
            console.log("this is user data: ", JSON.stringify(userData))
            console.log("this is secret key" , SECRET_KEY);
            const token = jwt.sign(userData, SECRET_KEY, { expiresIn: '12h'});
            console.log(token);
            res.cookie('accessToken', token, {httpOnly: true, sameSite: 'Lax'})
            req.cookies.accessToken = token;
            req.user = userData;
            const userObjStr = JSON.stringify(user);
            const encryptedUser = encryptData(userObjStr)
            return res.status(200).json(encryptedUser);
        }
        else{
            return res.status(404).json({message: 'the user does not exist'});
        }
    } catch (error) {
        console.log(error);
        handleError(error, res);
    }
})

router.post('/create/lego', async (req, res) => {
    const existingLego = await Lego.findOne({model : req.body.model})

    if(existingLego){
        return res.status(400).send({});
    } 
    else{
        const newLego = new Lego(req.body);
        newLego.save().catch(err => console.log(err));
        return res.status(200).send(newLego)
    }
})

router.post('/purchase', async (req, res) => {
    const newPurchase = [];
    for(var i = 0; i < req.body.length; i++){
        var purchase = req.body[i];
        var userIdString = purchase.userId;
        var userObjectId = ObjectId(userIdString);
        var userDoc = await User.findById(userObjectId);
        const newIndividualPurchase = new Purchase(purchase);
        var legoObj = ObjectId(purchase.legoID);
        var lego = await Lego.findById(legoObj);
        if(!lego){
            newPurchase.push({});
        }
        else{
                if (userDoc) {
                    newIndividualPurchase.save().catch(err => console.log(err));
                    newPurchase.push(newIndividualPurchase);
        
                    // start here
                    // this creates the lego object id of the lego being sold by a certain user
                    var legoSoldObjectId = ObjectId(purchase.legoID);
                    var legoSold = await Lego.findById(legoSoldObjectId);
                    var userObjId = ObjectId(legoSold.user_seller_id);
                    var userSeller = await User.findById(userObjId);
                    console.log(userSeller);
                    var legoList = userSeller.legos_sold;
                    
                    if(!legoList.includes(legoSoldObjectId)){
                        legoList.push(legoSoldObjectId);
                        const updatedUser = {
                            username: userSeller.username,
                            available_money: userSeller.available_money,
                            email: userSeller.email,
                            first_name : userSeller.first_name,
                            last_name: userSeller.last_name,
                            legos_sold : legoList,
                            isSeller : userSeller.isSeller
                        };
                        const userQuery = {email : userSeller.email};
                        await User.findOneAndUpdate(userQuery, updatedUser);
                    }
        
                } else {
                    return res.status(404).send({});
                }
            }
        }
        return res.status(200).send(newPurchase);
})

router.get('/fetch/lego/:legoID', async (req,res) => {
    console.log("this is the lego id: " + req.params.legoID);
    const legoObjId = ObjectId(req.params.legoID);
    const lego = await Lego.findById(legoObjId);
    if(lego){
        return res.status(200).send(lego)
    }
    else{
        return res.status(404).send({})
    }
})

router.get('/fetch/legos/all', async (req, res) => {
    const legos = await Lego.find().sort({rating: -1})
    // const sortedLegos = sortAllLegosByRating(legos);
    // console.log(sortedLegos)
    return res.status(200).send(legos);
})

router.get('/fetch/expired/legos', async (req, res) => {
    const legos = await Lego.find({is_expired : true});
    // for(var i = 0; i < legos.length; i++){
    //     var lego = legos[i];
    //     var timestamp = req.params.lego.
    // }
    return res.status(200).send(legos);
})

router.get('/legos/filter/by/price/:category/:price', async (req, res) => {
    const category = req.params.category;
    const price = parseInt(req.params.price);
    if(isNaN(price)){
        return res.status(404).send({});
    }
    const query = {$and: [{price: {$lte:price}}, {category: {$eq: category}}]};
    const legos = await Lego.find(query);
    return res.status(200).send(legos);
})

router.get('/legos/filter/by/category/:category', async (req, res) => {
    try{
        const category = req.params.category;
        const legos = await Lego.find({category: category})
        if(legos){
            return res.status(200).send(legos);
        }
        else{
            return res.status(404).send({});
        }
    }
    catch(error){
        console.log(error);
        return res.status(400).send({});
    }
})

router.get('/lego/categories', verifyToken, async (req, res) => {
    const legos = await Lego.find();
    var categories = [];
    var categoriesRes = {};
    
    for (var i = 0; i < legos.length; i++) {
        if (!categories.includes(legos[i].category)) {
            categories.push(legos[i].category)
        }
    }
    categoriesRes.categories = categories;
    const stringifiedCategories = JSON.stringify(categoriesRes);
    const encryptCategories = encryptData(stringifiedCategories);
    return res.status(200).send(encryptCategories);
})


router.get('/fetch/total/profit/:userID', async (req,res) => {
    const userObjId = ObjectId(req.params.userID);
    const user = await User.findById(userObjId);
    if(user){
        if(user.isSeller){
            const legosList = user.legos_sold;
            var totalProfits = 0;
            for(var i = 0; i < legosList.length; i++){
                const legoId = String(legosList[i]);
                const purchaseList = await Purchase.find({legoID : legoId});
                for(var j = 0; j < purchaseList.length; j++){
                    var total = purchaseList[i].total;
                    totalProfits = totalProfits + total;
                }
            }
            var profitRes = {};
            profitRes.totalSales = totalProfits;
            const profitResString = JSON.stringify(profitRes);
            const encryptedProfitRes = encryptData(profitResString);
            return res.status(200).send(encryptedProfitRes);
        }
        else{
            return res.status(400).send({});
        }
    }   
    else{
        return res.status(404).send({})
    }
})

router.put('/switch/user/:userID', async (req,res) => {
    const userObjId = ObjectId(req.params.userID);
    const user = await User.findById(userObjId);
    if(user){
        if(!user.isSeller){
            const updatedUser = {
                username: user.username,
                available_money: user.available_money,
                email: user.email,
                first_name : user.first_name,
                last_name: user.last_name,
                legos_sold : user.legos_sold,
                isSeller : true
            };
            const userQuery = {email : user.email};
            await User.findOneAndUpdate(userQuery, updatedUser);
            return res.status(200).send(updatedUser);
        }
        else{
            return res.status(400).send({});
        }
    }
    else{
        return res.status(404).send({});
    }
})


router.put('/modify/lego/:legoID/:category', async (req, res) => {
    const legoObjId = ObjectId(req.params.legoID);
    const lego = await Lego.findById(legoObjId);
    if(lego){
        const updatedLego = 
        {
            name: lego.name,
            description: lego.description,
            price: lego.price,
            rating: lego.rating,
            imageURL: lego.imageURL,
            model: lego.model,
            user_seller_id : lego.user_seller_id,
            category : req.params.category
        }
        const query = {model : lego.model};
        await Lego.findOneAndUpdate(query, updatedLego);
        return res.status(200).send(updatedLego);
    }
    else{
        return res.status(404).send({});
    }
})


router.get('/fetch/top/users', async (req,res) => {
    const userList = await User.find();
    const richestUsers = [];


    userList.sort(async function(user1, user2) {
        const user1String = String(user1._id);
        const user2String = String(user2._id);
        const user1Profit = await axios.get(`http://localhost:5000/api/v1/lego/deals/fetch/total/profit/${user1String}`)
        const user2Profit = await axios.get(`http://localhost:5000/api/v1/lego/deals/fetch/total/profit/${user2String}`)
      
         if (user1Profit === 0 && user2Profit === 0) return 1 / user2Profit - 1 / user1Profit || 0;
         else return user2Profit - user1Profit;
      });
      
    for(var i = userList.length - 1; i > userList.length - 6; i--){
        richestUsers.push(userList[i]);
    }
    
    return res.status(200).send(richestUsers);
    
})


router.delete('/delete/lego/:legoID', async (req,res) => {
    const legoObj = ObjectId(req.params.legoID);
    const lego = await Lego.findById(legoObj);
    if(lego){
        const legoQuery = {model : lego.model};
        await Lego.findOneAndDelete(legoQuery);
        return res.status(200).send(lego);
    }
    else{
        return res.status(404).send({})
    }
})



router.post('/create/review', async (req,res) => {
    const userObjId = req.body.userID;
    const user = ObjectId(userObjId);
    if(user){
        const newReview = new Review(req.body);
        newReview.save().catch(err => console.log(err));
        return res.status(200).send(newReview);
    }
    else{
        return res.status(400).send({});
    }
})

router.get('/fetch/reviews/:userID', async (req,res) => {
    const userObjStrId = req.params.userID;
    const user = ObjectId(userObjStrId);
    if(user){
        const reviewList = await Review.find({userID : userObjStrId});
        return res.status(200).send(reviewList);
    }
    else{
        return res.status(404).send({});
    }
})

router.put('/update/review', async (req,res) => {
    const review = ObjectId(req.body._id)
    if(review){
        const updatedReview = {
            userID : req.body.userID,
            description : req.body.description,
            legoID : req.body.legoID,
            rating : req.body.rating,
            title : req.body.title,
            image: req.body.image
        }
        const userQuery = {_id : ObjectId(req.body._id)};
        await Review.findOneAndUpdate(userQuery, updatedReview);
        return res.status(200).send(updatedReview);
    }
    else{
        return res.status(404).send({})
    }
})

router.get('/fetch/review/:reviewID', async (req,res) => {
    const reviewObjId = ObjectId(req.params.reviewID)
    const review = await Review.findById(reviewObjId)
    if(review){
        return res.status(200).send(review)
    }
    else{
        return res.status(404).send({})
    }
})

router.delete('/remove/review/:reviewID', async (req,res) => {
    const reviewObjId = ObjectId(req.params.reviewID)
    const review = await Review.findById(reviewObjId)
    if(review){
        await Review.findByIdAndDelete(reviewObjId)
        return res.status(200).send(review)
    }
    else{
        return res.status(404).send({})
    }
})


// write an api that takes in a category and price filter
// and rturn legos of that category and price filter
// ie. category: scifi price filter = less than or equal to $50




module.exports = router;

 


//.find()
//.findById()
//.findOneAndUpdate()
//.findOne()
//.find({})








