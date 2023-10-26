'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const { ServerApiVersion } = require('mongodb');
app.use(cors({
    origin: '*'
}));
app.use(express.json());

// environment variables
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Esoteric imports
const { routes } = require('./src/routes/routes.js');
const familyMembers = require('./src/data/data.js');
const { createMember } = require('./src/routes/routes.js');

// To remove deprecation warning
mongoose.set('strictQuery', false);

// Database connection
mongoose.connect(MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Database connection confirmation
const db = mongoose.connection;
db.once('open', () => {
    console.log('Database connected!');
    createMember(familyMembers);
});

app.post('/validate', routes.validateMember);
app.post('/addGift', routes.addGift);
app.post('/deleteGift', routes.removeGift);
app.post('/updateGift', routes.updateGift);

app.listen(PORT, () => {
    console.log(`SERVER UP AND RUNNING ON PORT ${PORT}`);
});
