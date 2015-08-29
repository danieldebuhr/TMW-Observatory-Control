console.log("homematic.js loaded");

var config      = require('./../config'); // get our config file
var rpc         = require('binrpc');
var forEach     = require('async-foreach').forEach;
var io          = require('./socket.io');

var rpcClient = rpc.createClient({host: config.homematicip, port: config.homematicport});
var rpcServer = rpc.createServer({port: config.homematic_rpclistenport }); //host: config.homematic_rpclistenip,

var timeDachAuf = null;
var timeDachZu = null;

rpcServer.on('event', function (err, params, callback) {

    if(params[0] == "rf2wired") {
        var id = findDeviceIndexByAddr(params[1]);
        if(id) {
            if(params[2] == "STATE") {
                console.log("HM-RPC-Event: ", params);
                manualUpdateDeviceState(params[1], params[3]);
            }
        }
    }

});

rpcServer.on('disconnect', function() {
   console.log("HM-RPC-Verbindung beendet.");
});

rpcClient.on('connect', function () {
    var url = 'xmlrpc_bin://' + config.homematic_rpclistenip + ':' + config.homematic_rpclistenport;
    console.log("HM-RPC-Verbindung initialisieren...");
    rpcClient.methodCall('init', [url, 'rf2wired'], function (err, res) {
        console.log('HM-RPC-Verbindung hergestellt', err, res);
    });
});

var deviceList = [];

function findDeviceIndexByAddr(addr) {
    for(var i = 0; i<=deviceList.length-1; i++) {
        if(deviceList[i].Address == addr) return i;
    }
    return false;
}

setTimeout(function() {
    updateOnActive();
}, 1000);

function updateOnActive() {
    if(io.checkOnlineClients() > 0) {
        setTimeout(function() {
            updateDeviceList(function() {
                updateOnActive();
            });
        }, 5000);
    } else {
        setTimeout(function() {
            updateOnActive();
        }, 5000);
    }
}



var homematic = {

    /**
     * Gibt eine Liste aller Gruppen zurück.
     * @param callback()
     */
    getGroups: function(callback) {

        var group   = require('./../app/models/group');
        group.find({}, function (err, grp) {
            callback(grp);
        });

    },

    /**
     * Schaltet eine Gruppe ein oder aus
     * @param groupName
     * @param value true oder false
     * @param callback
     */
    setGroupState: function(groupName, value, callback) {
        var dataPoint   = require('./../app/models/datapoint');
        var group   = require('./../app/models/group');
        group.findOne({Name: groupName}, function (err, grp) {
            if(!grp) callback({success: false, message: "Group not found"});
            forEach(grp.DatapointNames, function (item, index, arr) {
                var done = this.async();
                dataPoint.findOne({Name: item}, function(err, dp) {
                    if(dp) {
                        setValue(dp.Address, dp.Type, value, function() {
                            manualUpdateDeviceState(dp.Address, value, function() {
                                done();
                            });
                        });
                    } else {
                        done();
                    }
                });

            }, function() {
                updateDeviceList(callback);
            });
        });
    },

    /**
     * Erstellt oder Aktualisiert eine Gruppe
     * @param name
     * @param datapoints Semikolon-Getrennte Liste mit Namen der Datapoints
     * @param callback
     */
    manageGroup: function(name, datapoints, callback) {

        var group   = require('./../app/models/group');
        group.findOne({Name: name}, function (err, grp) {
            // Gruppe nicht vorhanden: Anlegen
            if(!grp) {

                var ndp = new group({
                    Name: name,
                    DatapointNames: datapoints
                });

                // save the sample user
                ndp.save(function (err) {
                    if (err) callback({success: false, message: "Error creating group"});
                    console.log('New Group created');
                    callback({success: true, message: "New group created"});
                });


                // Gruppe vorhanden: Updaten
            } else {
                dp.DatapointNames = datapoints;
                dp.save();
                callback({success: true, message: "Group update was successful"});

            }
        });

    },

    /**
     * Löscht eine Gruppe
     * @param name
     * @param callback
     */
    deleteGroup: function(name, callback) {
        var group   = require('./../app/models/group');

        ndp_name = name;
        if(ndp_name == "") {
            callback({success: false, message: "Name darf nicht leer sein."})
        } else {
            group.findOne({Name: ndp_name}, function (err, dp) {
                // Device nicht vorhanden: Fehler
                if(!dp) {
                    callback({success: false, message: "Group not found"});
                    // Device vorhanden: Löschen
                } else {
                    dp.remove();
                    callback({success: true, message: "Group '" + ndp_name + "' removed"});
                }
            });
        }
    },

    /**
     * Ermittelt den Typ eines Homematic-Aktors. Wrapper.
     * @param addr
     * @param callback
     */
    getType: function(addr, callback) {
        getType(addr, callback);
    },

    /**
     * Setzt den Status (z.B. an/aus) eines Homematic-Aktors. Wrapper.
     * @param addr
     * @param type
     * @param value
     * @param callback
     */
    setValue: function(addr, type, value, callback) {
        setValue(addr, type, value, callback);
    },

    /**
     * Schaltet einen Homematic-Aktor für eine bestimmte Zeit ein
     * @param name
     * @param time
     * @param callback
     */
    push: function(name, time, callback) {
        findDeviceByName(name, function(dp) {
            if(!dp) {
                callback({success: false, message: "Device not found"});
            } else {
                setValue(dp.Address, dp.Type, true, function() {
                    setTimeout(function() {
                        setValue(dp.Address, dp.Type, false, function() {
                            callback({success: true, message: "Pushed for " + time + "ms"});
                        })
                    }, time);
                });
            }
        })
    },

    /**
     * Schaltet einen Homematic-Aktor ein oder aus
     * @param addr
     * @param type
     * @param callback
     */
    toggleDevice: function(addr, type, callback) {

        getValueBase(addr, getValType(type), function(val) {

            if (type == "SWITCH") {
                if (val === false) {
                    setValue(addr, type, true, function () {
                        callback({success: true, value: val, newval: true});
                    })
                } else if (val === true) {
                    setValue(addr, type, false, function () {
                        callback({success: true, value: val, newval: false});
                    })
                }
            } else if (type == "DIMMER") {
                if (val < 1) {
                    setValue(addr, type, "1.0", function () {
                        callback({success: true, value: val, newval: "1.0"});
                    })
                } else if (val > 0) {
                    setValue(addr, type, "0.0", function () {
                        callback({success: true, value: val, newval: "0.0"});
                    })
                }
            } else {
                callback({success: false, message: "No handle for device-type " + type});
            }

        });
        
    },

    /**
     * Ermittelt den aktuellen Zustand eines Homematic-Aktors. Wrapper.
     * @param addr
     * @param value
     * @param callback
     */
    getValue: function getValue(addr, value, callback) {
        getValueBase(addr, value, callback);
    },

    /**
     * Gibt ein Device anhand seines Namens zurück. Wrapper.
     * @param name
     * @param callback
     */
    findDeviceByName: function(name, callback) {
        findDeviceByName(name, callback);
    },

    /**
     * Gibt die Liste aller registrierten Devices zurück, mit dem
     * zuletzt bekannten Status. Wrapper.
     * @param callback
     */
    getAllRegisteredDevices: function(callback) {
        callback(deviceList);
    },

    /**
     * Aktualisiert die deviceList. Wrapper.
     * @param callback
     */
    updateDeviceList: function(callback) {
        updateDeviceList(function() {
            callback();
        });
    },

    /**
     * Setzt den Status eines Devices in der deviceList, ohne den echten Status zu kennen. Wrapper.
     * @param address
     * @param value
     * @param callback
     */
    manualUpdateDeviceState: function(address, value, callback) {
        manualUpdateDeviceState(address, value, callback);
    },

    /**
     * Entfernt ein Device aus der MongoDB.
     * @param name
     * @param callback
     */
    deleteDevice: function(name, callback) {
        ndp_name = name;
        if(ndp_name == "") {
            callback({success: false, message: "Name darf nicht leer sein."})
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

    /**
     * Erstellt oder Updated ein Device in der MongoDB. Prüft auf Existenz in Homematic.
     * @param address
     * @param name
     * @param callback
     */
    manageDevice: function(address, name, callback) {
        var dataPoint   = require('./../app/models/datapoint');

        ndp_address = address;
        ndp_name    = name;

        if(ndp_address == "" || ndp_name == "") {
            callback({success: false, message: "Adresse und Name d&uuml;rfen nicht leer sein."})

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

    /**
     * Gibt den ValType zu einem Type zurück (z.B. SWITCH > STATE, DIMMER > LEVEL). Wrapper.
     * @param type
     * @returns {*}
     */
    getValType: function(type) {
        return getValType(type);
    }

};

module.exports = homematic;

// Initialisieren
initialDeviceList();
setTimeout(function() {
    updateDeviceList();
}, 500);

/**
 * Aktualisiert die deviceList.
 * @param callback
 */
function updateDeviceList(callback) {

    var dataPoint   = require('./../app/models/datapoint');
    var tmp_values = [];
    dataPoint.find({}, function(err, datapoints) {
        forEach(datapoints, function (item, index, arr) {
            var done = this.async();
            getValueBase(item.Address, getValType(item.Type), function(i) {
                if(i != null) tmp_values.push({Address: item.Address, Name: item.Name, Value: i});
                io.sendUpdate(item.Name, i);
                done();
            });
        }, allDone);
    });
    function allDone(notAborted, arr) {
        deviceList = tmp_values;
        //console.log("DeviceList updated", deviceList);
        if(callback) callback();
    }

}

/**
 * Initialisiert die deviceList mit unbekannter Value.
 */
function initialDeviceList() {

    var dataPoint   = require('./../app/models/datapoint');
    var tmp_values = [];
    dataPoint.find({}, function(err, datapoints) {
        forEach(datapoints, function (item, index, arr) {
            tmp_values.push({Address: item.Address, Name: item.Name, Value: null});
        }, allDone);
    });

    function allDone(notAborted, arr) {
        deviceList = tmp_values;
    }

}

/**
 * Gibt den ValType zu einem Type zurück (z.B. SWITCH > STATE, DIMMER > LEVEL).
 * @param type
 * @returns {*}
 */
function getValType(type) {
    if(type == "DIMMER") return "LEVEL";
    if(type == "SWITCH") return "STATE";
    if(type == "SHUTTER_CONTACT") return "STATE";
    return false;
}

/**
 * Ermittelt den aktuellen Zustand eines Homematic-Aktors.
 * @param addr
 * @param value
 * @param callback
 */
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

/**
 * Setzt den Status (z.B. an/aus) eines Homematic-Aktors.
 * @param addr
 * @param type
 * @param value
 * @param callback
 */
function setValue(addr, type, value, callback) {

    if(type == "SWITCH") {

        // Handelt es sich um das Dach?
        var id = findDeviceIndexByAddr(addr);
        if(id) {
            if(deviceList[id].Name == "Dach auf") {
                timeDachAuf = new Date();
                io.sendRoofUpdate("Dach auf", timeDachAuf);
            } else if(deviceList[id].Name == "Dach zu") {
                timeDachAuf = new Date();
                io.sendRoofUpdate("Dach zu", timeDachZu);
            }
        }

        rpcClient.methodCall('setValue', [addr, getValType(type), value], function (err, rpcres) {
            if(err) throw err;
            callback();
            manualUpdateDeviceState(addr, value);
        });
    } else {
        console.log("setValue - Error: Nur SWITCH kann geschaltet werden.");
        callback();
    }
}

/**
 * Ermittelt den Typ eines Homematic-Aktors.
 * @param addr
 * @param callback
 */
function getType(addr, callback) {
    rpcClient.methodCall('getDeviceDescription', [addr], function (err, rpcres) {
        if(err) throw err;
        callback(rpcres.TYPE);
    });
}

/**
 * Setzt den Status eines Devices in der deviceList, ohne den echten Status zu kennen.
 * @param address
 * @param value
 * @param callback
 */
function manualUpdateDeviceState(address, value, callback) {
    forEach(deviceList, function (item, index, arr) {
        if(deviceList[index].Address == address) {
            deviceList[index].Value = value;
            //console.log("Device-Update", address, deviceList[index].Name, value);
            io.sendUpdate(deviceList[index].Name, value);
        }
    }, function() {
        if(callback) callback();
    });
}

/**
 * Gibt ein Device anhand seines Namens zurück.
 * @param name
 * @param callback
 */
function findDeviceByName(name, callback) {
    var dataPoint   = require('./../app/models/datapoint');
    obj = name || "";
    if(!obj) callback(false);
    dataPoint.findOne({Name: obj}, function(err, dp) {
        if (!dp) callback(false);
        else callback(dp);
    });
}