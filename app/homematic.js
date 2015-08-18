var config      = require('./../config'); // get our config file
var rpc         = require('binrpc');
var forEach     = require('async-foreach').forEach;

var rpcClient = rpc.createClient({host: config.homematicip, port: config.homematicport});

var deviceList = [];

var homematic = {

    getType: function(addr, callback) {
        getType(addr, callback);
    },

    setValue: function(addr, type, value, callback) {
        setValue(addr, type, value, callback);
    },
    
    toggleDevice: function(addr, type, callback) {

        getValueBase(addr, getValType(type), function(val) {

            if (type == "SWITCH") {
                if (val === false) {
                    this.setValue(addr, type, true, function () {
                        callback({success: true, value: val, newval: true});
                    })
                } else if (val === true) {
                    this.setValue(addr, type, false, function () {
                        callback({success: true, value: val, newval: false});
                    })
                }
            } else if (type == "DIMMER") {
                if (val < 1) {
                    this.setValue(addr, type, "1.0", function () {
                        callback({success: true, value: val, newval: "1.0"});
                    })
                } else if (val > 0) {
                    this.setValue(addr, type, "0.0", function () {
                        callback({success: true, value: val, newval: "0.0"});
                    })
                }
            } else {
                callback({success: false, message: "No handle for device-type " + type});
            }

        });
        
    },

    getValue: function getValue(addr, value, callback) {
        getValueBase(addr, value, callback);
    },

    findDeviceByName: function(name, callback) {
        var dataPoint   = require('./../app/models/datapoint');
        obj = name || "";
        if(!obj) callback(false);
        dataPoint.findOne({Name: obj}, function(err, dp) {
            if (!dp) callback(false);
            else callback(dp);
        });
    },

    getAllRegisteredDevices: function(callback) {
        callback(deviceList);
    },

    updateDeviceList: function(callback) {
        updateDeviceList(function() {
            callback();
        });
    },

    manualUpdateDeviceState: function(address, value, callback) {
        forEach(deviceList, function (item, index, arr) {
            if(deviceList[index].Address == address) {
                deviceList[index].Value = value;
            }
        }, function() {
            callback();
        });
    },

    deleteDevice: function(name, callback) {
        ndp_name = name;
        if(ndp_name == "") {
            callback({success: false, message: "Require post-field name (eg. 'Computer 1')"})
        } else {
            dataPoint.findOne({Name: ndp_name}, function (err, dp) {
                // Device nicht vorhanden: Fehler
                if(!dp) {
                    callback({success: false, message: "Device not found"});
                    // Device vorhanden: Löschen
                } else {
                    dp.remove();
                    callback({success: true, message: "Device '" + ndp_name + "' removed"});
                }
            });
        }
    },

    manageDevice: function(address, name, callback) {
        var dataPoint   = require('./../app/models/datapoint');

        ndp_address = address;
        ndp_name    = name;

        if(ndp_address == "" || ndp_name == "") {
            callback({success: false, message: "Require post-fields address (eg. 'LEQ1234567:1') and name (eg. 'Computer 1')"})

        } else {

            dataPoint.findOne({Address: ndp_address}, function (err, dp) {

                // Device nicht vorhanden: Anlegen
                if(!dp) {
                    getType(ndp_address, function(type) {
                        if(!type) {
                            callback({success: false, message: "Device not found"});
                        } else {

                            // create a sample user
                            var ndp = new dataPoint({
                                Address: ndp_address,
                                Type: type,
                                Name: ndp_name
                            });

                            // save the sample user
                            ndp.save(function (err) {
                                if (err) callback({success: false, message: "Error creating device"});
                                console.log('New Datapoint created');
                                callback({success: true, message: "New device created"});
                            });
                        }
                    });

                    // Device vorhanden: Updaten
                } else {
                    dp.Name = ndp_name;
                    dp.save();
                    callback({success: true, message: "Device update was successful"});

                }

            });

        }

    },

    getValType: function(type) {
        return getValType(type);
    }

};

module.exports = homematic;


setTimeout(function() {
    startUpdateDeviceList();
}, 500);

function startUpdateDeviceList() {
    setTimeout(function() {
        updateDeviceList(function() {
            console.log("Devices updated");
            startUpdateDeviceList();
        });
    }, 5000);
}

function updateDeviceList(callback) {

    var dataPoint   = require('./../app/models/datapoint');
    var tmp_values = [];
    dataPoint.find({}, function(err, datapoints) {
        forEach(datapoints, function (item, index, arr) {
            var done = this.async();
            getValueBase(item.Address, getValType(item.Type), function(i) {
                if(i != null) tmp_values.push({Address: item.Address, Name: item.Name, Value: i});
                done();
            });
        }, allDone);
    });
    function allDone(notAborted, arr) {
        deviceList = tmp_values;
        callback();
    }

}

function getValType(type) {
    if(type == "DIMMER") return "LEVEL";
    if(type == "SWITCH") return "STATE";
    return false;
}

function getValueBase(addr, value, callback) {
    rpcClient.methodCall('getValue', [addr, value], function (err, rpcres) {
        if(rpcres["faultCode"]) {
            console.log(rpcres);
            callback(null);
        } else {
            callback(rpcres);
        }
    });
}

function setValue(addr, type, value, callback) {
    rpcClient.methodCall('setValue', [addr, getValType(type), value], function (err, rpcres) {
        if(err) throw err;
        callback();
    });
}

function getType(addr, callback) {
    rpcClient.methodCall('getDeviceDescription', [addr], function (err, rpcres) {
        if(err) throw err;
        callback(rpcres.TYPE);
    });
}