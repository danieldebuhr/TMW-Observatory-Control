console.log("SIO :: Loaded");


var hm = null;

var io = {

    startSocketServer: function (new_app) {

        app = new_app;

        app.io.sockets.on('connection', function (socket) {

            console.log("SIO <- New Connection " + socket.handshake.address.address);
            console.log("SIO :: Client-Count #", app.io.sockets.clients().length);

            socket.on('disconnect', function() {
                console.log("SIO :: Close Connection " + socket.handshake.address.address);
                console.log("SIO :: Client-Count #", app.io.sockets.clients().length);
            });

            socket.on('toggle', function(device) {
                console.log("SIO :: Toggle: ", device.Name);
                hm.toggle(device, function(success, message) {
                    console.log("SIO :: Toggle: ", device.Name, success, message);
                })
            });

        });

    },

    initHm: function (new_hm) {
        hm = new_hm;
    },

    checkOnlineClients: function() {
        return app.io.sockets.clients().length;
    },

    sendUpdate: function(device) {
        console.log("SIO -> update [", device.Name, ",", device.State, "]");
        app.io.broadcast('updateDevice', {device: device});
    }

};

module.exports = io;