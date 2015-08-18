var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./../config');

// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
var GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET;
var CALLBACK = config.GOOGLE_CALLBACK;

module.exports = function(app, passport) {

    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.  However, since this example does not
    //   have a database of user records, the complete Google profile is
    //   serialized and deserialized.
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    // Use the GoogleStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and Google
    //   profile), and invoke a callback with a user object.
    passport.use(new GoogleStrategy({
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: CALLBACK
        },
        function(accessToken, refreshToken, profile, done) {

            // asynchronous verification, for effect...
            process.nextTick(function () {

                var User = require('./models/user.js');

                User.findOne({ 'id' : profile.id }, function(err, user) {

                    if(err)
                        return done(err);

                    if(user) {
                        return done(null, user);

                    } else {

                        var newUser = new User();

                        newUser.id = profile.id;
                        newUser.displayName = profile.displayName;
                        newUser.familyName = profile.familyName;
                        newUser.givenNamen = profile.givenNamen;
                        newUser.gender = profile.gender;
                        newUser.photo = profile.photos[0].value;
                        newUser.admin = false;
                        newUser.apiId = "";

                        newUser.save(function(err) {
                            if(err)
                                throw err;
                            return done(null, newUser);
                        });

                    }

                });

                // To keep the example simple, the user's Google profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Google account with a user record in your database,
                // and return that user instead.
                //return done(null, profile);
            });
        }
    ));


};