var config = require('./../config'); // get our config file

var express     = require('express');
var app         = express();

var User   = require('./../app/models/user'); // get our mongoose model
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

app.set('superSecret', config.secret);


auth = {

    checkTokenWithousRes: function(token, callback) {
        checkToken(token, callback);
    },

    checkToken: function(req, res, next) {

        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {

            checkToken(token, function(decoded) {
                if(decoded) {
                    req.decoded = decoded;
                    next();
                } else {
                    return res.json({success: false, message: 'Failed to authenticate token.'});
                }
            })

        } else {

            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'Token required.'
            });

        }

    },

    login: function (req, res, next) {

        var username = req.body.username || '';
        var password = req.body.password || '';

        if(username == "" || password == "") {
            res.json({ success: false, message: 'Username and password required.'});
        } else {

            // find the user
            User.findOne({
                displayName: req.body.username
            }, function (err, user) {

                if (err) throw err;

                if (!user) {
                    res.json({success: false, message: 'Authentication failed. User not found.'});
                } else if (user) {


                    // Only User with password can get a token (eg. System Accounts for other applications)
                    if(user.password == "") {
                        res.json({success: false, message: 'User cannot get a token.'})

                        // check if password matches
                    } else if (user.password == req.body.password) {
                        res.json({success: false, message: 'Authentication failed. Wrong password.'});
                    } else {
                        // if user is found and password is right
                        // create a token
                        var token = jwt.sign(user, app.get('superSecret'), {
                            expiresInMinutes: 1440 // expires in 24 hours
                        });

                        // return the information including token as JSON
                        res.json({
                            success: true,
                            message: "It's dangerous to go alone! Take this.",
                            token: token
                        });
                    }

                }

            });

        }

    }
};

module.exports = auth;

function checkToken(token, callback) {
    if(token == "") callback(false);
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function (err, decoded) {
        if (err) {
            callback(false);
        } else {
            callback(decoded);
        }
    });

}