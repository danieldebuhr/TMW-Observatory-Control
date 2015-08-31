var devices         = require('./models/devices');
var hm              = require('./homematic');

var web = {

    page_index: function(req, res) {

        devices.find({}, function(err, devices) {
            if(devices) {
                devicelist = {};
                for (var i = 0; i <= devices.length - 1; i++) {
                    devicelist[devices[i].Address] = devices[i];
                }
                res.render('index', {page: 'index', user: req.user, devices: devicelist});
            } else {
                res.render('index', {page: 'index', user: req.user, devices: {}});
            }
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
                res.render('devices', { user: req.user, page: "bearbeiten", devices: devicelist, success: req.flash('success'), error: req.flash('error')});
            } else {
                res.render('devices', { user: req.user, page: "bearbeiten", devices: {}, success: req.flash('success'), error: req.flash('error')});
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
                        req.flash('error', "Konnte das Device nicht hinzufügen. Adresse korrekt?");
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
                                req.flash('error', "Konnte das Device nicht hinzufügen. Fehler in der Datenbank.");
                                return res.redirect('/devices');
                            } else {
                                req.flash('success', "Neues Device hinzugefügt.");
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