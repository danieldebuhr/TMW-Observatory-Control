var express         = require('express');
var router          = express.Router();
var tokenAuth       = require('./auth-token');
var User            = require('./models/user');

var web             = require('./web');
var api             = require('./api');

router.post('/authenticate', tokenAuth.login); // Login für Token für API Zugriff

/**
 * API wird über die Middleware authApi validiert.
 */
router.all('/api/*', [authApi]);

router.get('/api', function(req, res) {
    res.json({success: true, message: "TMW-Observatory-Control API!"});
});

router.param('addr', api.validateDevice);
router.param('state', api.validateState);

/**
 * Routen für Device-State
 */
router.get('/api/device/:addr/state/:state', api.setDeviceState);
router.get('/api/device/:addr/toggle', api.toggleDeviceState);
router.get('/api/device/:addr', api.getDeviceState);

/**
 * Routen für die Benutzerverwaltung.
 */
router.get('/api/user/enable/:id', api.enableUser);
router.get('/api/user/disable/:id', api.disableUser);
router.get('/api/user/settokenpw/:id/:pw', api.setUserPW); // für Token, nur bei Systemaccounts
router.get('/api/user/get/all', api.getAllUsers);

/**
 * Routen für die Web-Ansicht
 */
router.all('/*', [authApp]);  //tokenAuth.checkToken
router.get('/', web.page_index);
router.get('/benutzer', web.user);
router.get('/account', web.account);
router.get('/devices', web.page_devices);
router.post('/deviceManager', web.deviceManagerPost);
router.get('/deleteDevice/:addr', web.deleteDevice);

module.exports = router;


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