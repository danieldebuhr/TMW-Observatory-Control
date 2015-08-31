var hm              = require('./homematic');
var apilink         = require('./models/apilink');
var request         = require('request');

var api = {

    validateDevice: function(req, res, next, addr) {

        hm.findDeviceByAddress(addr, function(deviceByName) {
            if(deviceByName) {
                req.device = deviceByName;
                next();
            } else {
                hm.findDeviceById(name, function(deviceById) {
                    if(deviceById) {
                        req.device = deviceById;
                        next();
                    } else {
                        res.status(404);
                        res.json({success: false, message: name + " nicht gefunden"});
                    }
                })
            }
        });

    },

    validateState: function(req, res, next, state) {

        if(state == "true" || state == "1" || state == "on") {
            req.state = true;
            next();
        } else if(state == "false" || state == "0" || state == "off") {
            req.state = false;
            next();
        } else {
            console.log('validateState: ' + state + ' wird nicht akzeptiert.');
            res.status(500);
            res.json({success: false, message: state + ' wird nicht akzeptiert.'});
        }

    },

    validateApiLink: function(req, res, next, apilinkid) {

        apilink.findById(apilinkid, function(err, apilink) {
            if(apilink) {
                req.apilink = apilink;
                next();
            } else {
                res.status(404);
                res.json({success: false, message: apilink + " nicht gefunden"});
            }
        });

    },

    setDeviceState: function(req, res) {
        hm.setState(req.device, req.state, function(success, message) {
            res.json({success: success, message: message});
        });
    },

    toggleDeviceState: function(req, res) {
        hm.toggle(req.device, function(success, message) {
            res.json({success: success, message: message});
        });
    },

    getDeviceState: function(req, res) {
        hm.getState(req.device, function(success, message, device) {
            res.json({success: success, message: message, state: device.State, device: device});
        });
    },

    /**
     * Aktiviert den Admin-Modus eines Benutzers, so dass er die Anwendung verwenden kann.
     * @param req
     * @param res
     */
    enableUser: function(req, res) {

        var User = require('./models/user');
        User.findOne({_id: req.params.id}, function(err, user) {
            if(user) {
                user.admin = true;
                user.save();
                res.json({success: true});
            } else {
                res.json({success: false, message: "User not found"});
            }
        });

    },

    /**
     * Entfernt den Admin-Modus eines Benutzers.
     * @param req
     * @param res
     */
    disableUser: function(req, res) {

        var User = require('./models/user');
        User.findOne({_id: req.params.id}, function(err, user) {
            if(user._id == req.user._id) {
                res.json({success: false, message: "You cannot disable yourself"});
            } else if(user) {
                user.admin = false;
                user.save();
                res.json({success: true});
            } else {
                res.json({success: false, message: "User not found"});
            }
        });

    },

    /**
     * Erstellt ein Kennwort für einen Benutzer. Anschließend kann sich dieser über die
     * Schnittstelle /authentificate ein Token beschaffen und die reine API verwenden.
     * Notwendig für externe Anwendungen.
     * @param req
     * @param res
     */
    setUserPW: function(req, res) {

        var User = require('./models/user');
        User.findOne({_id: req.params.id}, function(err, user) {
            if(user) {
                user.password = req.params.pw;
                user.save();
                res.json({success: true});
            } else {
                res.json({success: false, message: "User not found"});
            }
        });

    },

    /**
     * Gibt alle Benutzer zurück.
     * @param req
     * @param res
     */
    getAllUsers: function(req, res) {

        var User = require('./models/user');
        User.find({}, function(err, user) {
            res.json({success: true, users: user});
        });

    },

    apiLink: function(req, res) {

        var cmd = "";
        if(req.params.cmd) cmd = "/" + req.params.cmd;

        request(req.apilink.URL + cmd, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
                res.send(body);
            } else {
                console.log(error);
                res.send(error);
            }

        })

    }

};

module.exports = api;

