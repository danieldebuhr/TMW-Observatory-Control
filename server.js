var express         = require('express');
var app             = express();
var bodyParser      = require('body-parser');
var morgan          = require('morgan');
var mongoose        = require('mongoose');
var cookieParser    = require('cookie-parser');
var expressSession  = require('express-session');
var ejs             = require('ejs-locals');
var passport        = require('passport');

var config = require('./config');

var port = process.env.PORT || 8080;
mongoose.connect(config.database);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.set('views', __dirname + '/views');
app.engine('ejs', ejs);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use('/app', express.static(__dirname + '/public'));

app.use(expressSession({
    secret: config.secret,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.all('/*', function(req, res, next) {
    //res.header("Access-Control-Allow-Origin", "localhost"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token');
    next();
});

require("./app/auth-google.js")(app, passport);
require("./app/routes-google.js")(app, passport);

app.use('/', require('./app/routes.js'));

app.use(function(req, res, next) {
    //var err = new Error('Not Found');
    //err.status = 404;
    //next(err);
    res.render('404', {user: null, page: null});
});

app.listen(port);
console.log('Magic happens at http://localhost:' + port);