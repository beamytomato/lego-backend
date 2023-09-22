const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require("./config/database").connect();
const lego = require('./routes/api/lego')
const auth = require('./routes/api/auth')

const app = express()
const PORT = 4002;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}))

app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended : false}));
app.use(bodyParser.json());

app.use(morgan("dev"))
app.use(helmet())
//connectDB();

app.use("/api/v1/lego/deals", lego);
app.use("/api/v1/lego/auth", auth);

app.listen(PORT, () => console.log(`API server is listening on port ${PORT}`))

// http://localhost:5000/api/v1/lego/deals/fetch/legos/all

// http://localhost:3000/








