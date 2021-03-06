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

var LED0 = 13;
var recycleLED = new mraa.Gpio(LED0);
recycleLED.dir(mraa.DIR_OUT);

// Cylon dependency to interface with Intel Edison GPIOs
Cylon.robot({
    connections: {
        edison: {adaptor: "intel-iot"}
    },
    devices: {
        servoRec0: {driver: "servo", pin: 5},
        servoTra1: {driver: "servo", pin: 3}
    },

    work: function(my) {
        var initial = 0;
        var rotation = 90;
        var duration = 3;

        // recycle http POST request received
        emitter.on('recycle', function() {
        	// reset to 90
		console.log("reset to 90");
		my.servoRec0.angle(90); // vertical
		my.servoTra1.angle(90);
		sleep.sleep(2);

		console.log("spin");
		my.servoRec0.angle(60); // recycle
		my.servoTra1.angle(120);
		sleep.sleep(2);

		console.log("return");
		my.servoRec0.angle(90);// reset to neutral
		my.servoTra1.angle(90);
	});
	
	emitter.on('trash', function(){
		console.log("trash");	
		my.servoRec0.angle(90); // vertical
		my.servoTra1.angle(90);
		sleep.sleep(2);

		console.log("spin");
		my.servoRec0.angle(120); // trash
		my.servoTra1.angle(60);
		sleep.sleep(2);
		
		console.log("return");
		my.servoRec0.angle(90); // reset to neutral
		my.servoTra1.angle(90);
	});

        emitter.on('light', function() {
		recycleLED.write(1);
		sleep.sleep(1);
		recycleLED.write(0);		
	});
        
	emitter.on('test', function() {
		console.log("testing fron motor");	
		//my.servoRec0.angle(90); // vertical
		my.servoTra1.angle(90);
		sleep.sleep(2);

		console.log("spin");
		//my.servoRec0.angle(170); // trash
		my.servoTra1.angle(70);
		sleep.sleep(2);
		
		console.log("return");
		//my.servoRec0.angle(90); // reset to neutral
		my.servoTra1.angle(90);
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

app.get('/listen', function(req, res) {
	'use strict';
	emitter.emit('light');
	res.send("Lighting...");
});

app.get('/test', function(req, res) {
	'use strict';
	emitter.emit('test');
	res.send("Testing close motor.");
});


// Begin the Node.js server
http.listen(PORT, function () {
     'use strict';
     console.log('listening on *:%d', PORT);
});
