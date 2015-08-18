var apiHomematic    = require('./homematic');

webclient = {

    index: function(req, res) {

        apiHomematic.getAllRegisteredDevices(function(data) {
            var daten = [];
            for(var i = 0; i < data.length; i++) {
                if (data[i].Value === true) {
                    displayclass = "btn-success";
                    url = "steuerung/" + data[i].Name + "/0";
                } else {
                    displayclass = "btn-default";
                    url = "steuerung/" + data[i].Name + "/1";
                }
                daten[i] = "<button class='btn " + displayclass + "' onclick='window.location.href = \"" + url + "\"'>" + data[i].Name + "</button>";
            }
            res.render('steuerung', { user: req.user, daten: daten, page: "steuerung" });
        });

    },

    refresh: function(req, res) {
        apiHomematic.updateDeviceList(function() {
            res.redirect('/app')
        });
    },

    hinzufuegen: function(req, res) {
        res.render('hinzufuegen', { user: req.user, page: "hinzufuegen" });
    },

    steuerung: function(req, res) {

        var name = req.params.name;
        var state = req.params.state;

        if(!(state == "1" || state == "0")) return res.redirect('/app');
        if(name == "") return res.redirect('/app');

        state = state == "1";

        apiHomematic.findDeviceByName(name, function(dp) {
            if(!dp) return res.redirect('/error');
            apiHomematic.setValue(dp.Address, dp.Type, state, function() {
                apiHomematic.manualUpdateDeviceState(dp.Address, state, function() {
                    return res.redirect('/app');
                });
            });
        });

    },

    manager: function(req, res) {

        var address = req.body.Address;
        var name = req.body.Name;

        apiHomematic.manageDevice(address, name, function(result) {
            updateDeviceList(function() {
                return res.redirect('/app');
            });
        });

    },

    account: function(req, res) {
        res.render('account', { user: req.user, page: "account" });
    }

};

module.exports = webclient;