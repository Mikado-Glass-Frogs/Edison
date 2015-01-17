"use strict";

// Dependencies
var Cylon = require("cylon");
var emitter = require('events').EventEmitter;
var wit = require('node-wit');
var sleep = require('sleep');
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var express = require('express');
var mraa = require("mraa");

var LED0 = 12;
var LED1 = 13;
var recycleLED = new mraa.Gpio(LED0);
var trashLED = new mraa.Gpio(LED1);

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
        var initial = 0
        var rotation = 90;
        var sleep = 3;

        var recycle = [my.servoRec0, my.servoRec1];
        var trash = [my.servoTra0, my.servoTra1];

        // recycle http POST request received
        emitter.on('recycle', function() {
            recycleLED.write(1);
	    sleep(1);
	    recycleLED.write(0);
        });

        // trash http POST request received
        emitter.on('trash', function() {
            trashLED.write(1);
	    sleep(1);
	    trashLED.write(0);
	});
    }
}).start();

// Use Express with bodyParser
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.json());
app.use(express.urlencoded());

// Define static variables
var WIT_TOKEN = "SKTW2C7JNR6WBTSBH5XAYEJ2IT2A2DMI";
var PORT = 80;

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
}

function operate (servos, angle, sleep) {
    for each (servo in servos)
        servo.angle(angle);
    sleep(sleep);
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

app.get(function() {}, function (request, response) {
    'use strict';
    binaryClassifier(response);
    response.send('Voice Command...');
});

// Begin the Node.js server
http.listen(PORT);
