//load environment variables from the .env file while in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
// initialize the Twilio and Twitter clients
const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);
const twitterClient = require('twitter')({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// load addt'l packages
const moment = require('moment');
const assert = require('assert');

//initialize MongoDB client
const MongoClient = require('mongodb').MongoClient
const uri = process.env.MLAB_URI || 'mongodb://localhost:27017/bos';

let delay; //initialize delay for app engine
MongoClient.connect(uri, function(err, db) {
    "use strict";
    //test connection for errors, will stop app if Mongo connection is down on load
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

//the function that runs the show
function appEngine(collection) {
    //get the most recent tweet id_str if one has been saved
    collection.findOne({}, { sort: { id_str: -1 }, limit: 1 })
        .then(tweet => {
            //if we do not have any tweets in the DB, then the default value is 0
            const lastTweetId = tweet && tweet.hasOwnProperty('id_str') ? tweet.id_str : 0;

            //call the Twitter API - for all tweets from @wesbos, filter out retweets, and only tweets that mention the word 'stickers'
            twitterClient.get('search/tweets', { q: 'from:wesbos -filter:retweets stickers', since_id: lastTweetId }, (err, tweets, response) => {
                //log any twitter errors
                if (err) {
                    return console.error({ twitterError: err });
                }
                //make sure we got a response with list of tweets - if no list of tweets, then no mention of stickers
                if (tweets.statuses && tweets.statuses.length) {

                    //call Twilio SMS API
                    twilioClient.messages.create({
                            to: process.env.TWILIO_PERSONALNUMBER,
                            from: process.env.TWILIO_TWILIONUMBER,
                            body: `Wes Bos just tweeted about stickers: ${tweets.statuses[0].text}`
                        })
                        .then(msg => {
                            //log the received tweet
                            console.log(`SMS with id: ${msg.sid} sent at timestamp: ${moment.now()}`);

                            //insert all the new tweets into the db
                            collection.insertMany(tweets.statuses)
                                .then(done => {})
                                .catch(err => {
                                    if (err) console.error({ mongoInsertError: err })
                                });
                        })
                        .catch(err => console.error({ twilioError: err }));

                }
            });
        })
        .catch(err => console.error({ MongoFindError: err }));
}