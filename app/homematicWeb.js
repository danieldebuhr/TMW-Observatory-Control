var dataPoint   = require('./../app/models/datapoint'); // get our mongoose model
var homematic   = require('./homematic');

var homematicWeb = {

    getStatus: function(req, res) {

        var name = req.params.name;

        homematic.findDeviceByName(name, function(dp) {
            if(!dp) return res.json({success: false, message: "Device not found"});
            homematic.getValue(dp.Address, homematic.getValType(dp.Type), function(val) {
                return res.json({success: true, value: val});
            });
        });

    },

    toggleState: function(req, res) {

        var name = req.params.name;

        homematic.findDeviceByName(name, function(dp) {
            if(!dp) return res.json({success: false, message: "Device not found"});
            homematic.toggleDevice(dp.Address, dp.Type, function (result) {
                return res.json(result);
            });
        });

    },

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
                    return res.json({success: true});
                });

            }

        });

    },

    getAllValues: function(req, res) {

        homematic.getAllRegisteredDevices(function(devicelist) {
            res.json({success: true, data: devicelist})
        });

    },

    listRegisteredDevices: function(req, res) {
        dataPoint.find({}, function(err, datapoints) {
            res.json({success: true, data: datapoints});
        });
    },

    manageDevice: function(req, res) {

        ndp_address = req.body.address || '';
        ndp_name    = req.body.name || '';

        homematic.manageDevice(ndp_address, ndp_name, function(result) {
            res.json(result);
        });

    },

    deleteDevice: function(req, res) {

        var ndp_name    = req.body.name || '';
        homematic.deleteDevice(ndp_name, function(result) {
            res.json(result);
        });

    }

};


module.exports = homematicWeb;