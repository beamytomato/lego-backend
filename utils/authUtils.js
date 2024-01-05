const mongoose = require('mongoose')
const CryptoJS = require('crypto-js')
const SECRET_KEY = process.env.SERVER_SECRET_KEY
const jwt = require('jsonwebtoken')
const User = require('../model/user')


const handleError = (error, res) => {
    if (!error) {
        return res.status(500).json({error: "an unknown error"})
    }

    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({error: "Invalid object id format"})
    }

    if (error.name === 'MongoError') {
        return res.status(500).json({error: "Database error has occurred"})
    }

    return res.status(500).json({error: "an error has occcured"})
}

const encryptData = (data) => {
    try {
        const encryptedData = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
        return encryptedData;
    } catch(error) {
        console.log(error);
    }
}

const sortAllLegosByRating = (legoList) => {
    // define code here
    for(var i = 0; i < legoList.length; i++){
        var maxIndex = i;
        for(var j = i + 1; j < legoList.length; j++){
            if(legoList[j].rating > legoList[maxIndex].rating){
                maxIndex = j;
            }
        }
        temp = legoList[i];
        legoList[i] = legoList[maxIndex];
        legoList[maxIndex] = temp;
    }
    return legoList;
}

const verifyToken = async (req, res, next) => {
    const accessToken = req.cookies.accessToken
    if (!accessToken) {
        return res.status(201).json({message: "access token is missing"})
    }
    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY)
        req.user = decoded
        next()
    } catch(error) {
        if (error instanceof jwt.TokenExpiredError) {
            try {
                const decodedCookie = jwt.decode(accessToken)
                const user = await User.findById(decodedCookie._id);

                if (!user) {
                    return res.status(404).json({message: "no user found"})
                }
                const userData = user.toJSON();
                const token = jwt.sign(userData, SECRET_KEY, { expiresIn: '12h'});
                console.log(token);
                res.cookie('accessToken', token, {httpOnly: true, sameSite: 'Lax'})
                req.cookies.accessToken = token;
                req.user = userData;
                next()
            } catch(jwtError) {
                return res.status(500).json({message: "error generating new token"})
            }
        } else {
            return res.status(401).json({message : 'invalid token'})
        }
    }
}


module.exports = {handleError, encryptData, verifyToken, sortAllLegosByRating};