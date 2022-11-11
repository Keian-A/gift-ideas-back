'use strict';

const { Schema, model } = require('mongoose');

const GiftSchema = new Schema({
    giftName: { type: String, required: true },
    link: { type: String, required: false },
    bought: { type: Boolean, required: true }
});

const FamilySchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    gifts: [GiftSchema]
});

const FamilyModel = model('Family', FamilySchema);

module.exports = FamilyModel;
