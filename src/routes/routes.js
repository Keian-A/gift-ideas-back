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

// function to login
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

// function to add a gift to your own list
routes.addGift = async function (req, res) {
    try {
        if (req.body.username) {
            let familyMember = await Member.findOne({ username: req.body.username });
            let temp = {
                giftName: req.body.giftName,
                link: req.body.link,
                bought: false,
                buyer: "undefined"
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
        res.status(500).send('Server Error.');
    }
}

// function to remove an item from your own list
routes.removeGift = async function (req, res) {
    try {
        let familyMember = await Member.findOne({ username: req.body.username });
        familyMember.gifts.splice(req.body.giftNumber, 1);
        await familyMember.save();
        res.status(204).send('Resource deleted successfully.');
    } catch {
        res.status(500).send('Server Error.');
    }
}

// function to update the "bought" boolean on an individual gift object
routes.updateGift = async function (req, res) {
    try {
        let familyMember = await Member.findOne({ username: req.body.username });
        familyMember.gifts[req.body.giftNumber].bought = !familyMember.gifts[req.body.giftNumber].bought;
        familyMember.gifts[req.body.giftNumber].buyer = req.body.currentMember;
        await familyMember.save();
        let familyList = await Member.find({});
        familyList = hideForYou(familyList, req.body.currentMember);
        res.status(200).send(familyList);
    } catch (e) {
        res.status(500).send('Server Error.');
    }
}

routes.deleteMyBoughtGifts = async function (req, res) {
    try {
        let familyMember = await Member.findOne({username: req.body.username});
        for (let ii = familyMember.gifts.length -1; ii >= 0; ii--) {
            if (familyMember.gifts[ii].bought) {
                familyMember.gifts.splice(ii, 1);
            }
        }
        await familyMember.save();
        let familyList = await Member.find({});
        familyList = hideForYou(familyList, req.body.currentMember);
        res.status(200).send(familyList);
    } catch (e) {
        res.status(500).send('Server Error.');
    }
}

module.exports = { routes, createMember };
