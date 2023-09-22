const express = require ('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
// const {SECRET_KEY} = require('../../utils/authUtils')
const jwt = require('jsonwebtoken')



router.get("/generate/secret/key", (req, res) => {
    var secretJSON = {};

    // Generate 256-bit secret key
    const words = CryptoJS.lib.WordArray.random(256 / 8);
    const secret = words.toString(CryptoJS.enc.Hex);

    secretJSON.secretKey = secret;
    return res.status(200).send(secretJSON)
})

router.get('/generate/token' , (req, res) => {
    try {
        const SECRET_KEY = process.env.SERVER_SECRET_KEY
        console.log(SECRET_KEY)
        const accessToken = jwt.sign({}, SECRET_KEY, { expiresIn: '1h'});

        console.log(accessToken);

        res.cookie('accessToken', accessToken, {httpOnly: true, sameSite: 'None', secure: false})
        return res.status(200).json({messsage: 'Token has been generated'});
    } catch (error) {
        console.log(error)
        return res.status(500).json({errorMessage: 'Error while generating access token'})
    }
})

module.exports = router;