var devices         = require('./models/devices');
var apilink         = require('./models/apilink');
var hm              = require('./homematic');

var web = {

    page_index: function(req, res) {

        devices.find({}, function(err, devices) {
            devicelist = {};
            for (var i = 0; i <= devices.length - 1; i++) {
                devicelist[devices[i].Address] = devices[i];
            }
            apilink.find({}, function(err, apilinks) {
                apilinklist = {};
                for (var i = 0; i <= apilinks.length - 1; i++) {
                    apilinklist[apilinks[i]._id] = apilinks[i];
                }
                res.render('index', {page: 'index', user: req.user, devices: devicelist, apilinks: apilinklist});
            });
        });

    },

    /**
     * Account-Seite.
     * @param req
     * @param res
     */
    account: function(req, res) {
        res.render('account', { user: req.user, page: "account" });
    },

    /**
     * Benutzerverwaltung.
     * @param req
     * @param res
     */
    user: function(req, res) {

        var User = require('./models/user');
        User.find({}, function(err, user) {
            res.render('user', { user: req.user, page: "user", userdata: user});
        });

    },

    /**
     * Bearbeiten von Devices.
     * @param req
     * @param res
     */
    page_devices: function(req, res) {
        devices.find({}, function(err, devices) {
            if(devices) {
                devicelist = {};
                for (var i = 0; i <= devices.length - 1; i++) {
                    devicelist[devices[i].Address] = devices[i];
                }
                res.render('devices', { user: req.user, page: "devices", devices: devicelist, success: req.flash('success'), error: req.flash('error')});
            } else {
                res.render('devices', { user: req.user, page: "devices", devices: {}, success: req.flash('success'), error: req.flash('error')});
            }
        });

    },

    /**
     * Bearbeiten von ApiLinks.
     * @param req
     * @param res
     */
    page_apilink: function(req, res) {
        apilink.find({}, function(err, apilinks) {
            apilinklist = {};
            for (var i = 0; i <= apilinks.length - 1; i++) {
                apilinklist[apilinks[i]._id] = apilinks[i];
            }
            res.render('apilink', { user: req.user, page: "apilink", apilinks: apilinklist, success: req.flash('success'), error: req.flash('error')});
        });
    },

    /**
     * Löschen von APILinks.
     * @param req
     * @param res
     */
    deleteApilink: function(req, res) {
        apilink.findById(req.params.apilinkid, function(err, found_apilink) {
            if(found_apilink) {
                found_apilink.remove();
                req.flash('success', "APILink gel&ouml;scht.");
                return res.redirect('/apilinks');
            } else {
                req.flash('error', "APILink nicht gefunden.");
                return res.redirect('/apilinks');
            }
        });
    },

    /**
     * Hinzufügen von neuen APILinks.
     * @param req
     * @param res
     */
    apilinkManagerPost: function(req, res) {

        var id = req.body.id;
        var name = req.body.Name;
        var url = req.body.URL;
        var kategorie = req.body.Kategorie;
        var inputfield = req.body.InputField;
        var gotoapi = req.body.GotoAPI;

        apilink.findById(id, function(err, found_apilink) {
            if(found_apilink) {
                found_apilink.Name = name;
                found_apilink.URL = url;
                found_apilink.Kategorie = kategorie;
                found_apilink.InputField = inputfield;
                found_apilink.GotoAPI = gotoapi;
                found_apilink.save();
                req.flash('success', "APILink aktualisiert.");
                return res.redirect('/apilinks');
            } else {

                var alink = new apilink({
                    Name: name,
                    URL: url,
                    Kategorie: kategorie,
                    InputField: inputfield,
                    GotoAPI: gotoapi
                });

                alink.save(function (err) {
                    if (err) {
                        req.flash('error', "Konnte den APILink nicht hinzuf%uuml;gen. Fehler in der Datenbank.");
                        return res.redirect('/apilinks');
                    } else {
                        req.flash('success', "Neuer APILink hinzugef&uuml;gt.");
                        return res.redirect('/apilinks');
                    }
                });
            }
        });

    },

    /**
     * Löschen von Devices.
     * @param req
     * @param res
     */
    deleteDevice: function(req, res) {
        req.device.remove();
        req.flash('success', "Device gel&ouml;scht.");
        return res.redirect('/devices');
    },

    /**
     * Hinzufügen von neuen Devices.
     * @param req
     * @param res
     */
    deviceManagerPost: function(req, res) {

        var address = req.body.Address;
        var name = req.body.Name;
        var kategorie = req.body.Kategorie;
        var dachauf = (req.body.DachAuf == "true");
        var dachzu = (req.body.DachZu == "true");
        var endlagedachzu = (req.body.EndlageDachZu == "true");

        hm.findDeviceByAddress(address, function(device) {
            if(device) {
                device.Name = name;
                device.Kategorie = kategorie;
                device.DachAuf = dachauf;
                device.DachZu = dachzu;
                device.EndlageDachZu = endlagedachzu;
                device.save();
                req.flash('success', "Device aktualisiert.");
                return res.redirect('/devices');
            } else {
                hm.getType(address, function(type) {
                    if(!type) {
                        req.flash('error', "Konnte das Device nicht hinzuf&uuml;gen. Adresse korrekt?");
                        return res.redirect('/devices');
                    } else {

                        var dev = new devices({
                            Address: address,
                            Kategorie: kategorie,
                            Type: type,
                            Name: name,
                            DachAuf: dachauf,
                            DachZu: dachzu,
                            EndlageDachZu: endlagedachzu
                        });

                        dev.save(function (err) {
                            if (err) {
                                req.flash('error', "Konnte das Device nicht hinzuf&uuml;gen. Fehler in der Datenbank.");
                                return res.redirect('/devices');
                            } else {
                                req.flash('success', "Neues Device hinzugef&uuml;gt.");
                                return res.redirect('/devices');
                            }
                        });
                    }
                })
            }
        });

    }

};

module.exports = web;