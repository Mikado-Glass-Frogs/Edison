"use strict";

// Dependencies
var Cylon = require("cylon");
var Emitter = require('events').EventEmitter,
    emitter = new Emitter();
var wit = require('node-wit');
var sleep = require('sleep');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.json());

var http = require('http').Server(app);
var mraa = require("mraa");

var LED0 = 12;
var LED1 = 13;
var recycleLED = new mraa.Gpio(LED0);
var trashLED = new mraa.Gpio(LED1);
recycleLED.dir(mraa.DIR_OUT);
trashLED.dir(mraa.DIR_OUT);
// Cylon dependency to interface with Intel Edison GPIOs
Cylon.robot({
    connections: {
        edison: {adaptor: "intel-iot"}
    },
    devices: {
        servoRec0: {driver: "servo", pin: 5},
        servoRec1: {driver: "servo", pin: 6},
        servoTra0: {driver: "servo", pin: 7},
        servoTra1: {driver: "servo", pin: 8}
    },

    work: function(my) {
        var initial = 0;
        var rotation = 90;
        var duration = 3;

        // recycle http POST request received
        emitter.on('recycle', function() {
        	my.servoRec0.angle(initial);
		my.servoRec1.angle(initial);
		my.servoTra0.angle(rotation);
		my.servoTra1.angle(rotation);
		sleep.sleep(3);
		my.servoRec0.angle(initial);
		my.servoRec1.angle(initial);
		sleep.sleep(3);
	});

        // trash http POST request received
        emitter.on('trash', function() {
	 operate(trash, rotation, duration);
	});
    }
}).start();

// Use Express with bodyParser

// Define static variables
var WIT_TOKEN = "SKTW2C7JNR6WBTSBH5XAYEJ2IT2A2DMI";
var PORT = 44000;

// returns result based on the binary classifier built and trained with Wit.ai API
function binaryClassifier (input) {
    console.log("Making Wit.ai API call...");
    wit.captureTextIntent(WIT_TOKEN, input, function(error, response) {
        if (err) console.log("Error with Wit.ai API", err);
        else {
            if (response['outcomes'].length == 0) 
      		console.log("Unable to process the input.");

            switch (response['outcomes'][0]) {
                case 'recycle': emitter.emit('recycle'); break;
                case 'trash': emitter.emit('trash'); break;
            }
        }
    }
    )}

function operate (servos, angle, duration) {
    for (var i = 0; i < servos.length; i++)
        servos[i].angle(0);
    for (var j = 0; j < servos.length; j++)
	servos[j].angle(angle);
    sleep.sleep(duration);
    for (var k = 0; k < servos.length; k++)
	servos[k].angle(0);
    sleep.sleep(duration);
}

// HTTP POST request handler

// handle / request
app.get('/', function (request, response) {
    'use strict';
    response.send("<h1>PennApps 2015 Winter</h1><h3>Get ready for Environmental Revolution</h3>");
});

// handle recycle request
app.get('/recycle', function (request, response) {
    'use strict';
    // fire recycle event
    emitter.emit('recycle');
    response.send('Recycling...');
});

// handle trash request
app.get('/trash', function (request, response) {
    'use strict';
    // fire trash event
    emitter.emit('trash');
    response.send('Trashing...');
});
/*
app.get(function() {}, function (request, response) {
    'use strict';
    binaryClassifier(response);
    response.send('Voice Command...');
});
*/
// Begin the Node.js server
http.listen(PORT, function () {
     'use strict';
         console.log('listening on *:%d', PORT);
         });
