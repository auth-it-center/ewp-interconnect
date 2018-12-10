/**
* @file In this file the proper functions are registered to the methods of each API.
*/

/**
* @description This function registers the endpoints and the methods to the apis.
* @param {object} app The express object of the app.
*/
module.exports = function(app) {
	const discovery = require('./controllers/discoveryController.js');
	const echo = require('./controllers/echoController.js');
	const institutions = require('./controllers/institutionsController.js')
	const response = require('./../connector/method_not_allowed.js');

	// discovery Routes
	app.get(process.env.DISCOVERY_URL, discovery.discovery_get);
	app.post(process.env.DISCOVERY_URL, response.method_not_allowed);
	app.delete(process.env.DISCOVERY_URL, response.method_not_allowed);
	app.put(process.env.DISCOVERY_URL, response.method_not_allowed);

	// echo Routes
	app.get(process.env.ECHO_URL, echo.echo_get);
	app.post(process.env.ECHO_URL, echo.echo_post);
	app.delete(process.env.ECHO_URL, response.method_not_allowed);
	app.put(process.env.ECHO_URL, response.method_not_allowed);

	// institutions Routes
	app.get(process.env.INSTITUTIONS_URL, institutions.institutions_get);
	app.post(process.env.INSTITUTIONS_URL, institutions.institutions_post);
	app.delete(process.env.INSTITUTIONS_URL, response.method_not_allowed);
	app.put(process.env.INSTITUTIONS_URL, response.method_not_allowed);
};
