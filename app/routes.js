var express         = require('express');
var router          = express.Router();
var tokenAuth       = require('./auth-token');
var User            = require('./models/user');
var homematicWeb    = require('./homematicWeb');
var webApp          = require('./webApp');
var request         = require('request');
var config          = require('./../config');

var activeHomematicUpdate = false;

router.post('/authenticate', tokenAuth.login); // Login für Token für API Zugriff

/**
 * API wird über die Middleware authApi validiert.
 */
router.all('/api/*', [authApi]);

router.get('/api', function(req, res) {
    res.json({success: true, message: "TMW-Observatory-Control API!"});
});

/**
 * Routen für die Steuerung von Homematic-Aktoren und Gruppen.
 */
router.get('/api/set/:name/:state', homematicWeb.setState);
router.get('/api/set/g/:name/:state', homematicWeb.setGroup);
router.get('/api/toggle/:name', homematicWeb.toggleState);
router.get('/api/push/short/:name', homematicWeb.pushShort);
router.get('/api/push/long/:name', homematicWeb.pushLong);

/**
 * Routen für den Status von Homematic-Aktoren und Gruppen.
 */
router.get('/api/get/groups', homematicWeb.getGroups);
router.get('/api/get/devices', homematicWeb.getDevices);
router.get('/api/get/devices/update', homematicWeb.getDevicesWithUpdate);
router.get('/api/get/all', homematicWeb.getAllValues);
router.get('/api/get/:name', homematicWeb.getStatus);

/**
 * Routen für die Verwaltung von Homematic-Aktoren und Gruppen.
 */
router.post('/api/config/device', homematicWeb.manageDevice);
router.delete('/api/config/device', homematicWeb.deleteDevice);
router.post('/api/config/group', homematicWeb.manageGroup);
router.delete('/api/config/group', homematicWeb.deleteGroup);

/**
 * Custom-Steuerung Left/Right.
 */
router.get('/api/tmwLeftAPI/:cmd', tmwLeftControlAPI);
router.get('/api/tmwRightAPI/:cmd', tmwRightControlAPI);

/**
 * Routen für die Benutzerverwaltung.
 */
router.get('/api/user/enable/:id', homematicWeb.enableUser);
router.get('/api/user/disable/:id', homematicWeb.disableUser);
router.get('/api/user/settokenpw/:id/:pw', homematicWeb.setUserPW); // für Token, nur bei Systemaccounts
router.get('/api/user/get/all', homematicWeb.getAllUsers);

/**
 * Routen für die Web-Ansicht
 */
router.all('/*', [authApp]);  //tokenAuth.checkToken
router.get('/', webApp.index);
router.get('/benutzer', webApp.user);
router.get('/account', webApp.account);
router.get('/refresh', webApp.refresh);
router.get('/steuerung', webApp.steuerung);
router.get('/steuerung/:name/:state', webApp.steuern);
router.get('/steuerung/g/:name/:state', webApp.steuernGruppe);
router.get('/hinzufuegen', webApp.hinzufuegen);
router.post('/manager', webApp.manager);

module.exports = router;

/**
 * @depricated
 * Aktualisiert die deviceList nach jedem Seitenaufruf. Wird nicht verwendet.
 * @param req
 * @param res
 * @param next
 */
function updateHomematic(req, res, next) {
    if(!activeHomematicUpdate) {
        activeHomematicUpdate = true;
        setTimeout(function() {
            homematicWeb.updateDeviceList(function() {
                console.log("Updated");
                activeHomematicUpdate = false;
            });
        }, 1);
    }
    next();
}

/**
 * Authentifizierungs-Middleware, welche Benutzer erst nach Token und dann
 * nach Passport validiert. Ermöglicht so Api-Zugriff nach Login auch ohne Token.
 * @param req
 * @param res
 * @param next
 */
function authApi(req, res, next) {

    // Zuerst Token:
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    tokenAuth.checkTokenWithousRes(token, function(decoded) {
        if(decoded) {
            req.decoded = decoded;
            return next();
        } else {

            if (req.isAuthenticated()) {
                if (req.user.admin) {
                    return next();
                } else {
                    return res.json({success: false, message: 'Failed to authenticate.'});
                }
            } else {
                return res.json({success: false, message: 'Failed to authenticate.'});
            }

        }
    });

}

/**
 * Authentifizierungs-Middleware über Passport für die WebApp.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function authApp(req, res, next) {
    if(req.isAuthenticated()) {
        if(req.user.admin) {
            return next();
        }
    } else {
        res.redirect('/login');
    }
}

/**
 * API-Weiterleitung für die lokale Programme Kontrolle (Links).
 * @param req
 * @param res
 */
function tmwLeftControlAPI(req, res) {

    var apiurl = req.params.cmd;

    var tmwleftcontrol_api = config.tmwleftcontrol_api;
    request(tmwleftcontrol_api + apiurl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            res.send(error);
        }

    })

}

/**
 * API-Weiterleitung für die lokale Programme Kontrolle (Rechts).
 * @param req
 * @param res
 */
function tmwRightControlAPI(req, res) {

    var apiurl = req.params.cmd;

    var tmwrightcontrol_api = config.tmwrightcontrol_api;
    request(tmwrightcontrol_api + apiurl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            res.send(error);
        }

    })

}