var dataPoint   = require('./../app/models/datapoint');
var group       = require('./../app/models/group');
var homematic   = require('./homematic');
var io          = require('./socket.io');

var homematicWeb = {

    /**
     * Gibt die Gruppen als JSON zurück.
     * @param req
     * @param res
     */
    getGroups: function(req, res) {
        homematic.getGroups(function(groups) {
            return res.json(groups);
        });
    },

    /**
     * Gibt die Devices als JSON zurück.
     * @param req
     * @param res
     */
    getDevices: function(req, res) {
        homematic.getAllRegisteredDevices(function(devices) {
            return res.json(devices);
        });
    },

    /**
     * Aktualisiert die Devices und gib diese als JSON zurück.
     * @param req
     * @param res
     */
    getDevicesWithUpdate: function(req, res) {
        homematic.updateDeviceList(function() {
            homematic.getAllRegisteredDevices(function(devices) {
                return res.json(devices);
            });
        });
    },

    /**
     * Setzt den Status einer Gruppe.
     * @param req
     * @param res
     * @returns {*}
     */
    setGroup: function(req, res) {
        var name = req.params.name;
        var state = req.params.state;

        if(!(state == "1" || state == "0")) return res.json({success: false, message: "Unknown state '" + state + "'"});
        if(name == "") return res.json({success: false, message: "Group name needed"});

        state = state == "1";

        homematic.setGroupState(name, state, function() {
            return res.json({success: true});
        });
    },

    /**
     * Erstellt oder Aktualisiert eine Gruppe.
     * @param req
     * @param res
     * @returns {*}
     */
    manageGroup: function(req, res) {

        var name = req.body.name;
        var datapoints = req.body.datapoints;

        if(name == "") return res.json({success: false, message: "Group Name needed"});
        if(datapoints == "") return res.json({success: false, message: "Datapoints needed (join with ';')"});

        homematic.manageGroup(name, datapoints.split(';'), function(result) {
            return res.json(result);
        });

    },

    /**
     * Löscht eine Gruppe.
     * @param req
     * @param res
     * @returns {*}
     */
    deleteGroup: function(req, res) {

        var name = req.body.name;

        if(name == "") return res.json({success: false, message: "Group Name needed"});

        homematic.deleteGroup(name, function(result) {
            return res.json(result);
        });

    },

    /**
     * Gibt den Status eines Devices zurück.
     * @param req
     * @param res
     */
    getStatus: function(req, res) {

        var name = req.params.name;

        homematic.findDeviceByName(name, function(dp) {
            if(!dp) return res.json({success: false, message: "Device not found"});
            homematic.getValue(dp.Address, homematic.getValType(dp.Type), function(val) {
                return res.json({success: true, value: val});
            });
        });

    },

    /**
     * Schaltet ein Device an oder aus.
     * @param req
     * @param res
     */
    toggleState: function(req, res) {

        var name = req.params.name;

        homematic.findDeviceByName(name, function(dp) {
            if(!dp) return res.json({success: false, message: "Device not found"});
            homematic.toggleDevice(dp.Address, dp.Type, function (result) {
                io.sendUpdate(name, result.newval);
                return res.json(result);
            });
        });

    },

    /**
     * Setzt den Status eines Devices.
     * @param req
     * @param res
     * @returns {*}
     */
    setState: function(req, res) {

        var name = req.params.name;
        var state = req.params.state;

        if(!(state == "1" || state == "0")) return res.json({success: false, message: "Unknown state '" + state + "'"});
        if(name == "") return res.json({success: false, message: "Device name needed"});

        state = state == "1";

        homematic.findDeviceByName(name, function(dp) {
            if(!dp) {
                return res.json({success: false, message: "Device not found"});
            } else {

                homematic.setValue(dp.Address, dp.Type, state, function () {
                    io.sendUpdate(name, state);
                    return res.json({success: true});
                });

            }

        });

    },

    /**
     * Schaltet ein Device für 100ms ein.
     * @param req
     * @param res
     * @returns {*}
     */
    pushShort: function(req, res) {
        var name = req.params.name;
        if(name == "") return res.json({success: false, message: "Device name needed"});
        homematic.push(name, 100, function(result) {
            return res.json(result); //{success: true, message: "Pushed short"}
        });
    },

    /**
     * Schaltet ein Device für 6000ms ein.
     * @param req
     * @param res
     * @returns {*}
     */
    pushLong: function(req, res) {
        var name = req.params.name;
        if(name == "") return res.json({success: false, message: "Device name needed"});
        homematic.push(name, 6000, function(result) {
            return res.json(result); //{success: true, message: "Pushed long"}
        });
    },

    /**
     * Gibt alle Devices zurück.
     * @param req
     * @param res
     */
    getAllValues: function(req, res) {
        homematic.getAllRegisteredDevices(function(devicelist) {
            res.json({success: true, data: devicelist})
        });
    },

    /**
     * Gibt alle Devices der Datenbank zurück.
     * @param req
     * @param res
     */
    listRegisteredDevices: function(req, res) {
        dataPoint.find({}, function(err, datapoints) {
            res.json({success: true, data: datapoints});
        });
    },

    /**
     * Erstellt und Aktualisiert ein Device.
     * @param req
     * @param res
     */
    manageDevice: function(req, res) {

        ndp_address = req.body.address || '';
        ndp_name    = req.body.name || '';

        homematic.manageDevice(ndp_address, ndp_name, function(result) {
            res.json(result);
        });

    },

    /**
     * Löscht ein Device.
     * @param req
     * @param res
     */
    deleteDevice: function(req, res) {

        var ndp_name    = req.body.name || '';
        homematic.deleteDevice(ndp_name, function(result) {
            res.json(result);
        });

    },

    /**
     * Aktualisiert die DeviceList
     * @param callback
     */
    updateDeviceList: function(callback) {
        homematic.updateDeviceList(callback);
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

    }

};


module.exports = homematicWeb;