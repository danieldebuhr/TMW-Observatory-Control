console.log("socket.io loaded");

var app = {};

module.exports = {

    startSocketServer: function (new_app) {
        app = new_app;
        app.io.sockets.on('connection', function (socket) {
            console.log("Socket.io - Neue Verbindung mit " + socket.id);
            socket.on('disconnect', function() {
                console.log("Socket.io - Verbindung beendet mit " + socket.id)
            })
        });

    },

    checkOnlineClients: function() {
        return app.io.sockets.clients().length;
    },

    sendUpdate: function(name, state) {
        console.log("Socket.io - Send Update", name, state);
        app.io.broadcast('updateDevice', {name: name, state: state});
    },

    sendRoofUpdate: function(dachname, time) {
        console.log("Socket.io - Sende Dach-Update", dachname, time);
        app.io.broadcast('roofUpdate', {dach: dachname, time: time});
    }

};