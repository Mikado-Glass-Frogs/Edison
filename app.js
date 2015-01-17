var express = require('express');
var mraa = require('mraa');
var wit = require('node-wit');
var sleep = require('sleep');

function rotate(PIN, angle) {
	var servo = new mraa.Gpio(PIN);
	servo.dir(mraa.DIR_OUT);
	
	if (angle > 180)
		angle = angle % 180;

	for (i = 0; i < angle; i++) {
		servo.write(i);
		sleep.sleep(1);
	}
	for (j = angle; j > 0; j--) {
		servo.write(j);
		sleep.sleep(1);
	}
}

rotate(8, 75);
