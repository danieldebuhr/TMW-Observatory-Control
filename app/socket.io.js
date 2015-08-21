console.log("socket.io loaded");

var ioapp = null;

module.exports = function(app) {

    if(app) ioapp = app;

    // Setup the ready route, and emit talk event.
    ioapp.io.on('connection', function(req) {
        console.log("Socket.io Verbindung hergestellt.");
    });

    return {
        sendUpdate: function(name, state) {
            if(ioapp) {
                ioapp.io.broadcast('updateDevice', {name: name, state: state});
            }
        }
    }

};