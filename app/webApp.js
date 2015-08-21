var apiHomematic    = require('./homematic');

webclient = {

    /**
     * Index-Seite und Haupt-Seite, übergibt beim laden alle Devices und Gruppen aus dem internen Cache.
     * @param req
     * @param res
     */
    index: function(req, res) {

        apiHomematic.getAllRegisteredDevices(function(devices) {
                apiHomematic.getGroups(function(groups) {
                    res.render('index', {
                        user: req.user,
                        devices: devices,
                        groups: groups,
                        page: "index",
                        success: req.flash('success'),
                        error: req.flash('error')
                    });
                });
        });

    },

    /**
     * Debugging-Steuer-Seite (wird später entfernt).
     * @param req
     * @param res
     */
    steuerung: function(req, res) {

        apiHomematic.getAllRegisteredDevices(function(devices) {
            apiHomematic.getGroups(function(groups) {
                var deviceDaten = [];
                for(var i = 0; i < devices.length; i++) {
                    if (devices[i].Value === true) {
                        displayclass = "btn-success";
                        url = "steuerung/" + devices[i].Name + "/0";
                    } else {
                        displayclass = "btn-default";
                        url = "steuerung/" + devices[i].Name + "/1";
                    }
                    deviceDaten[i] = "<span class='toggleButton'><button class='btn " + displayclass + "' onclick='window.location.href = \"" + url + "\"'>" + devices[i].Name + "</button></span>";
                }
                var groupDaten = [];
                var x = 0;
                for(var i = 0; i < groups.length; i++) {
                    url_on = "steuerung/g/" + groups[i].Name + "/1";
                    url_off = "steuerung/g/" + groups[i].Name + "/0";
                    groupDaten[x++] = "<span class='toggleButton'><button class='btn btn-success' onclick='window.location.href = \"" + url_on + "\"'>" + groups[i].Name + "</button></span>";
                    groupDaten[x++] = "<span class='toggleButton'><button class='btn btn-warning' onclick='window.location.href = \"" + url_off + "\"'>" + groups[i].Name + "</button></span>";
                }
                res.render('steuerung', { user: req.user, devices: deviceDaten, groups: groupDaten, devices_raw: devices, groups_raw: groups, page: "steuerung", success: req.flash('success'), error: req.flash('error') });
            });
        });

    },

    /**
     * Aktualisierung der Device-Daten - leitet auf / weiter.
     * @param req
     * @param res
     */
    refresh: function(req, res) {
        apiHomematic.updateDeviceList(function() {
            res.redirect('/')
        });
    },

    /**
     * Hinzufügen von neuen Devices.
     * @param req
     * @param res
     */
    hinzufuegen: function(req, res) {
        res.render('hinzufuegen', { user: req.user, page: "hinzufuegen", success: req.flash('success'), error: req.flash('error')});
    },

    /**
     * Steuern von Devices zu Debugzwecken (wird später entfernt).
     * @param req
     * @param res
     */
    steuern: function(req, res) {

        var name = req.params.name;
        var state = req.params.state;

        if(!(state == "1" || state == "0")) {
            req.flash('error', "Falscher State!");
            return res.redirect('/steuerung');
        }
        if(name == "") {
            req.flash('error', "Name fehlt!");
            return res.redirect('/steuerung');
        }

        state = state == "1";

        apiHomematic.findDeviceByName(name, function(dp) {
            if(!dp) {
                req.flash('error', "Device not found");
                return res.redirect('/steuerung');
            }
            apiHomematic.setValue(dp.Address, dp.Type, state, function() {
                apiHomematic.manualUpdateDeviceState(dp.Address, state, function() {
                    return res.redirect('/steuerung');
                });
            });
        });

    },

    /**
     * Steuern von Gruppen zu Debugzwecken (wird später entfernt)
     * @param req
     * @param res
     */
    steuernGruppe: function(req, res) {

        var name = req.params.name;
        var state = req.params.state;

        if(!(state == "1" || state == "0")) {
            req.flash('error', "Falscher State!");
            return res.redirect('/steuerung');
        }
        if(name == "") {
            req.flash('error', "Name fehlt!");
            return res.redirect('/steuerung');
        }

        state = state == "1";

        apiHomematic.setGroupState(name, state, function() {
            req.flash('success', "Gruppe geschaltet");
            return res.redirect('/steuerung');
        });

    },

    /**
     * Erstellen und Aktualisieren von Devices.
     * @param req
     * @param res
     */
    manager: function(req, res) {

        var address = req.body.Address;
        var name = req.body.Name;

        apiHomematic.manageDevice(address, name, function(result) {
            apiHomematic.updateDeviceList(function() {
                if(result.success) {
                    req.flash('success', "Erfolgreich hinzugef&uuml;gt / aktualisiert.");
                } else {
                    req.flash('error', result.message);
                }
                return res.redirect('/hinzufuegen');
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
     * Benutezrverwaltung.
     * @param req
     * @param res
     */
    user: function(req, res) {

        var User = require('./models/user');
        User.find({}, function(err, user) {
            res.render('user', { user: req.user, page: "user", userdata: user, success: req.flash('success'), error: req.flash('error')});
        });

    }



};

module.exports = webclient;