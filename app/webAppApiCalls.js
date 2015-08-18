var http = require('http');
var querystring = require('querystring');
var request = require('request');
var config = require("./../config.js");


api = {

    setState: function (token, name, state, callback) {

        var options = {
            host: config.apiHost,
            port: config.apiPort,
            path: '/api/set/' + name + '/' + state,
            method: 'GET',
            headers: {
                'x-access-token': token
            }
        };

        http.request(options, function (response) {

            var str = '';
            var data = {};

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                data = JSON.parse(str);
                callback(data);
            });

        }).end();

    },

    manageDevice: function (token, address, name, callback) {

        var form = {
            address: address,
            name: name
        };

        var formData = querystring.stringify(form);
        var contentLength = formData.length;

        var options = {
            uri: 'http://' + config.apiHost + ":" + config.apiPort + '/api/managedevice',
            method: 'POST',
            headers: {
                'x-access-token': token,
                'Content-Length': contentLength,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        };

        request(options, function (err, res, body) {
            callback(body);
        }).end();

    },

    getAll: function (token, callback) {

        var options = {
            host: config.apiHost,
            port: config.apiPort,
            path: '/api/get/all',
            method: 'GET',
            headers: {
                'x-access-token': token
            }
        };

        http.request(options, function (response) {

            var str = '';
            var data = {};

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                data = JSON.parse(str);
                callback(data);
            });

        }).end();

    }

};




module.exports = api;