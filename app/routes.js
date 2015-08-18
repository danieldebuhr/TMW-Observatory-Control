var express         = require('express');
var router          = express.Router();
var port            = process.env.PORT || 8080;
var tokenAuth       = require('./auth-token');
var User            = require('./models/user');
var homematicWeb    = require('./homematicWeb');
var webApp          = require('./webApp');

router.all('/api/*', [authApi]);  //tokenAuth.checkToken
router.all('/app/*', [authApp]);  //tokenAuth.checkToken

router.get('/api', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});


// Administration
router.post('/api/managedevice', homematicWeb.manageDevice);
router.delete('/api/managedevice', homematicWeb.deleteDevice);

// Steuerung
router.get('/api/set/:name/:state', homematicWeb.setState);
router.get('/api/toggle/:name', homematicWeb.toggleState);
router.get('/api/get/all', homematicWeb.getAllValues);
router.get('/api/get/:name', homematicWeb.getStatus);

router.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

router.post('/authenticate', tokenAuth.login);


router.get('/app/', webApp.index);
router.get('/app/account', webApp.account);
router.get('/app/refresh', webApp.refresh);
router.get('/app/hinzufuegen', webApp.hinzufuegen);
router.get('/app/steuerung/:name/:state', webApp.steuerung);
router.post('/app/manager', webApp.manager);




module.exports = router;



function authApi(req, res, next) {

    // Zuerst Token:
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    tokenAuth.checkTokenWithousRes(token, function(decoded) {
        if(decoded) {
            req.decoded = decoded;
            console.log("jo");
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

function authApp(req, res, next) {
    if(req.isAuthenticated()) {
        if(req.user.admin) {
            return next();
        }
    } else {
        res.redirect('/login');
    }
}