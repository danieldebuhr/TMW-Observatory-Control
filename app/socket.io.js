console.log("socket.io loaded");

var app = {};

module.exports = {

    startSocketServer: function (new_app) {
        app = new_app;
        app.io.sockets.on('connection', function (socket) {
            console.log("new connection: " + socket.id);
        });
    },

    sendUpdate: function(name, state) {
        console.log("Broadcast updateDevice", name, state);
        app.io.broadcast('updateDevice', {name: name, state: state});
    }

};