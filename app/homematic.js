console.log("RPC :: Loaded");

var devices         = require('./models/devices');
var rpc             = require('binrpc');
var config          = require('./../config');
var forEach         = require('async-foreach').forEach;
var io              = require('./socket.io');

hm_id               = config.homematic_rpc_id;

var hm = {
    validateState: function(state, callback) {
        if(state == "true" || state == "1" || state == "on") {
            callback(null, true);
        } else if(state == "false" || state == "0" || state == "off") {
            callback(null, false);
        } else {
            callback('validateState: ' + state + ' wird nicht akzeptiert.', null);
        }
    },
    findDeviceById: function (id, callback) {
    devices.findById(id, function(err, device) {
        if (!device) {
            console.log('findDeviceById: ' + id + ' nicht gefunden.');
            callback(false);
        } else {
            callback(device);
        }
    });
},
    findDeviceByAddress: function (addr, callback) {
        devices.findOne({Address: addr}, function(err, device) {
            if (!device) {
                //console.log('findDeviceByAddress: ' + addr + ' nicht gefunden.');
                callback(false);
            } else {
                callback(device);
            }
        });
    },
    findDeviceByName: function (name, callback) {
        devices.findOne({Name: name}, function(err, device) {
            if (!device) {
                //console.log('findDeviceByName: ' + name + ' nicht gefunden.');
                callback(false);
            } else {
                callback(device);
            }
        });
    },
    toggle: function (device, callback) {
        if(device.Type == "SWITCH") {
            var nstate = false;
            nstate = device.State != "true";
            hm.setState(device, nstate, function(success, message) {
                callback(success, message);
            });
        } else {
            callback(false, "Device ist nicht vom Typ SWITCH.");
        }
    },
    getState: function (device, callback) {
        rpcClient.methodCall('getValue', [device.Address, "STATE"], function (err, rpcres) {
            if(err) {
                callback(false, err);
            } else {
                callback(true, null, device);
            }
        });
    },
    setState: function(device, state, callback) {
        hm.validateState(state, function(err, vstate) {
            if(err) {
                callback(false, err);
            } else {
                rpcClient.methodCall('setValue', [device.Address, "STATE", state], function (err, rpcres) {
                    if(err) {
                        callback(false, err);
                    } else {
                        callback(true);
                    }

                });
            }
        });
    },

    /**
     * Ermittelt den Typ eines Homematic-Aktors.
     * @param addr
     * @param callback
     */
    getType: function(addr, callback) {
        rpcClient.methodCall('getDeviceDescription', [addr], function (err, rpcres) {
            if(err) {
                callback(false);
            } else {
                callback(rpcres.TYPE);
            }
        });
    }

};

module.exports = hm;

io.initHm(hm);


var localDeviceList = {};
updateLocalDeviceList();

function updateLocalDeviceList() {
    localDeviceList = {};
    devices.find({}, function (err, devices) {
        for (var i = 0; i <= devices.length - 1; i++) {
            localDeviceList[devices[i].Address] = devices[i];
        }
    });
}


var rpcClient = rpc.createClient({host: config.homematicip, port: config.homematicport});
var rpcServer = rpc.createServer({port: config.homematic_rpclistenport });

rpcClient.on('connect', function () {
    var url = 'bin://' + config.homematic_rpclistenip + ':' + config.homematic_rpclistenport;
    //console.log("HM-RPC-Verbindung initialisieren als", hm_id);
    rpcClient.methodCall('init', [url, hm_id], function (err, res) {
        if(!err) {
            console.log('RPC :: Verbindung hergestellt', res);
        } else {
            console.log('RPC :: Verbindung: Fehler', err);
        }
    });
});

rpcServer.on('system.multicall', function (method, params, callback) {
    console.log('RPC <- multicall', method, params);
    var response = [];
    for (var i = 0; i < params[0].length; i++) {
        if (rpcMethods[params[0][i].methodName]) {
            response.push(rpcMethods[params[0][i].methodName](null, params[0][i].params));
        } else {
            console.log('RPC <- undefined method ' + method + ' ' + JSON.stringify(params).slice(0,80));
            response.push('');
        }
    }
    callback(null, response);
});

rpcServer.on('event', function (err, params, callback) {
    callback(null, rpcMethods.event(err, params));
});
rpcServer.on('newDevices', function (err, params, callback) {
    callback(null, rpcMethods.newDevices(err, params));
});
rpcServer.on('deleteDevices', function(err, params, callback) {
    callback(null, rpcMethods.deleteDevices(err, params));
});
rpcServer.on('replaceDevice', function(err, params, callback) {
    callback(null, rpcMethods.replaceDevice(err, params));
});
rpcServer.on('listDevices', function(err, params, callback) {
    callback(null, rpcMethods.listDevices(err, params));
});
rpcServer.on('system.listMethods', function(err, params, callback) {
    callback(null, rpcMethods['system.listMethods'](err, params));
});

var rpcMethods = {
    event: function (err, params) {
        hm.findDeviceByAddress(params[1], function(device) {
            if(device) {
                if(params[2] == "STATE") {
                    device.State = params[3];
                    device.save();
                    updateLocalDeviceList();
                    io.sendUpdate(device);
                }

            }
        });
        console.log('RPC <- event ' + JSON.stringify(params));

        return '';
    },
    newDevices: function (err, params) {
        console.log('RPC <- newDevices ' + params.length);
        return '';
    },
    deleteDevices: function (err, params) {
        console.log('RPC <- deleteDevices ' + JSON.stringify(params));
        return '';
    },
    replaceDevice: function (err, params) {
        console.log('RPC <- replaceDevice ' + JSON.stringify(params));
        return '';
    },
    listDevices: function (err, params) {
        console.log('RPC <- listDevices ' + JSON.stringify(params));
        var res = [];
        for (var Address in localDeviceList) {
            res.push({ADDRESS: Address, VERSION: parseInt(localDeviceList[Address].Version)});
        }
        console.log('RPC -> listDevices response length ' + res.length);
        return res;
    },
    'system.listMethods': function (err, params) {
        return ['system.multicall', 'system.listMethods', 'listDevices', 'deleteDevices', 'newDevices', 'event'];
    }
};

// VIELEN DANK! An Anli & Hobbyquaker. Das Grundgerüst, welches die Beiden in ihrem Homematic-Manager verwendet, ist super.
// Dadurch wurde das Arbeiten mit den Homematic-Aktoren sehr angenehm und funktioniert nun so wie es soll.
// Das war außerdem der Anlass, die Homematic-Engine neu zu programmieren.
// https://github.com/hobbyquaker/homematic-manager