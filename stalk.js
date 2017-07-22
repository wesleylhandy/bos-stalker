const twitterKeys = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
}

const twilioClient = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
const twitterClient = require('twitter')(twitterKeys);
const MongoClient = require('mongodb').MongoClient

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bos';

const moment = require('moment');
const assert = require('assert');

let delay; //initialize delay for api call

function sendSMS(tweet) {
    return new Promise((resolve, reject)=>{
        twilioClient.messages.create({
            to: process.env.PERSONALNUMBER,
            from: process.env.TWILIONUMBER,
            body: `Wes Bos just tweeted about stickers: ${tweet}`
        }, (err, msg)=> {
            if(err) {
                reject(err);
            } else {
                console.log(`SMS with id: ${msg.sid} sent at timestamp: ${moment.now()}`);
                resolve('success');
            }
        });
    })
}

function getLastTweetId(collection, callback) {

    collection.findOne({},{sort: {id_str: -1}, limit: 1}).then(tweet=> callback(tweet.id_str)).catch(err=>callback(0));
   
}

function stalkerEngine(collection) {

    getLastTweetId(collection, lastTweetId => {

        twitterClient.get('search/tweets', {q: 'from:wesbos -filter:retweets stickers', since_id: lastTweetId}, (err, tweets, response)=>{
            if (tweets.statuses) {
                if(tweets.statuses.length) {
                    sendSMS(tweets.statuses[0].text).then(success=>{
                        collection.insertMany(tweets.statuses).then(done=>{}).catch(err=>{if(err) console.error(err)});
                    }).catch(err=>{
                        console.error(err);
                    });
                }
            }
        });
    });
}

MongoClient.connect(uri, function(err, db) {
    "use strict";

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    //get collection 'tweets' or create one
    const collection = db.collection('tweets');
   
    //initial call to start stalker
    stalkerEngine(collection);

    //call stalker once every 5 minutes afterwards
    delay = setInterval(function(){stalkerEngine(collection)}, 180000);
});
