if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);
const twitterClient = require('twitter')({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
const MongoClient = require('mongodb').MongoClient

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bos';

const moment = require('moment');
const assert = require('assert');

let delay; //initialize delay for api call

MongoClient.connect(uri, function(err, db) {
    "use strict";

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    //get collection 'tweets' or create one
    const collection = db.collection('tweets');

    //initial call to start stalker
    appEngine(collection);

    //call stalker once every 3 minutes afterwards, or interval of your choice
    //1000 * 60 * 3 = 180000

    delay = setInterval(function() { appEngine(collection) }, 180000);
});

function appEngine(collection) {
    collection.findOne({}, { sort: { id_str: -1 }, limit: 1 })
        .then(tweet => {
            const lastTweetId = tweet ? tweet.hasOwnProperty('id_str') ? tweet.id_str : 0 : 0;
            console.log(lastTweetId);
            //call the Twitter API
            twitterClient.get('search/tweets', { q: 'from:wesbos -filter:retweets stickers', since_id: lastTweetId }, (err, tweets, response) => {
                if (tweets.statuses) {
                    if (tweets.statuses.length) {
                        twilioClient.messages.create({
                                to: process.env.TWILIO_PERSONALNUMBER,
                                from: process.env.TWILIO_TWILIONUMBER,
                                body: `Wes Bos just tweeted about stickers: ${tweets.statuses[0].text}`
                            })
                            .then(msg => {
                                console.log(`SMS with id: ${msg.sid} sent at timestamp: ${moment.now()}`);
                                collection.insertMany(tweets.statuses).then(done => {}).catch(err => { if (err) console.error(err) });
                            })
                            .catch(err => console.error(err));
                    }
                }
            });
        });
}