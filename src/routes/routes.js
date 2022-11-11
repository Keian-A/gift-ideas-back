'use strict';

const bcrypt = require('bcrypt');
const Member = require('../models/Family.js');

// "hides" the status of if you are receiving a gift before sending back the list to the person, so you can't see your own list's status.
function hideForYou(list, username) {
    for (let ii = 0; ii < list.length; ii++) {
        if (list[ii].username === username) {
            for (let jj = 0; jj < list[ii].gifts.length; jj++) {
                list[ii].gifts[jj].bought = false;
            }
        }
    }
    return list;
}

function capitalizeFirstLetter(list) {
    for (let ii = 0; ii < list.length; ii++) {
        // Algorithm from https://flexiple.com/javascript/javascript-capitalize-first-letter/
        let str1 = list[ii].username;
        const str2 = str.charAt(0).toUpperCase() + str.slice(1);
    }
}

const routes = {};

// function only used on initial server load to generate members if they don't exist
async function createMember(list) {
    try {
        for (let ii = 0; ii < list.length; ii++) {
            let existing = await Member.findOne({ username: list[ii].username });
            if (!existing) {
                list[ii].password = await bcrypt.hash(list[ii].password, 10);
                await Member.create(list[ii]);
            }
        }
    } catch (e) {
        console.log(e.message);
    }
}

routes.validateMember = async function (req, res) {
    try {
        let memberResult = await Member.findOne({ username: req.body.username });
        if (memberResult) {
            let flag = await bcrypt.compare(req.body.password, memberResult.password);
            if (flag) {
                let listResult = await Member.find({});
                listResult = hideForYou(listResult, req.body.username);
                res.status(202).send(listResult);
            } else {
                res.status(404).send('Incorrect credentials.');
            }
        }
    } catch {
        res.status(404).send('Incorrect credentials.');
    }
}

routes.addGift = async function (req, res) {
    try {
        if (req.body.username) {
            let familyMember = await Member.findOne({ username: req.body.username });
            let temp = {
                giftName: req.body.giftName,
                link: req.body.link,
                bought: false
            }
            familyMember.gifts.push(temp);
            await familyMember.save();
            let familyList = await Member.find({});
            familyList = hideForYou(familyList, req.body.username);
            res.status(200).send(familyList);
        } else {
            res.status(404).send('User not found. This error is strange and this should never happen due to all potential users being generated on server load. Please contact your server admin, Keian :)');
        }
    } catch {
        res.status(500).send('Server error.');
    }
}

routes.removeGift = async function (req, res) {
    try {
        let familyMember = await Member.findOne({ username: req.body.username });
        familyMember.gifts.splice(req.body.giftNumber, 1);
        // familyMember.gifts = familyMember.gifts.filter(gift => gift.giftName !== req.body.giftName);
        await familyMember.save();
        res.status(204).send('Resource deleted successfully.');
    } catch {
        res.status(500).send('Server error.');
    }
}

routes.updateGift = async function (req, res) {
    try {
        console.log(req.body.username);
        console.log(req.body.giftNumber);
        let familyMember = await Member.findOne({ username: req.body.username });
        familyMember.gifts[req.body.giftNumber].bought = !familyMember.gifts[req.body.giftNumber].bought;
        await familyMember.save();
        let familyList = await Member.find({});
        familyList = hideForYou(familyList, req.body.currentMember);
        res.status(200).send(familyList);
    } catch (e) {
        res.status(500).send('Server error.');
    }
}

module.exports = { routes, createMember };
