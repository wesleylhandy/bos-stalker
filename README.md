# :squirrel: Stalking @wesbos on Twitter for Stickers

If you are like me, you love Wes Bos - he is Boss :exclamation: His courses have been helpful because he has makes things fun and interesting. This also means you are one of 110,000 other people in the world who have tried to [order stickers](http://bos.af) from him only to find, well, they are already sold out! :poop:

### Well, be denied no more.

This app combines a little twitter stalking with some twilio sms magic.

Everytime a new tweet from [@wesbos](https://www.twitter.com/wesbos) includes the term 'sticker', this app will send me an SMS.

I have set up calls to the twitter REST API once per hour looking for new tweets. If a new tweet is found that meets my query, me phone in me pocket will start a-buzzing. :speech_balloon:

#### How can you install this yourself?

1. Set up an app in twitter by going to https://dev.twitter.com, get your consumer key, consumer secret, access tokey key, and access token secret.
   * When I set this up on my local machine, I save my keys to a file named `config.js` and import it into my main file. When deploying, you will save all your keys as environment variables.
2. Get a twilio dev account by going to https://www.twilio.com/, get your Account SID and Auth Token, which you will also save in `config.js` and later as environment variables, then purchase your first phone number, which only runs $1/month and charges you only a penny to send a message.
3. Fork and clone this repo, then run `npm install` or `yarn` if you use yarn.
4. Use your favorite host to deploy. Currently, the `package.json` and `Procfile` are set up for a worker to run on Heroku.

#### Update Regarding Heroku Deployment && Data Persistence.

On a local machine, using the built-in `fs` node-module is an easy way to manage data persistence. However, when deploying to heroku, I found that this system would not work.

Therefore I refactored my code for data persistence with MongoDB, and utilized the `mLab MongoDB :: Mongodb` add-on.