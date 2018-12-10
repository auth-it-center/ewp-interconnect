/**
* @file This file is responsible for serving the manifest.xml.
* It contains the function that handles the GET request for the discovery API.
*/
const fs = require('fs');

/**
* @description This function is used to serv the servers' manifest during a GET request.
* @param {Object} req The request object.
* @param {Object} res The response object.
*/
exports.discovery_get = function(req, res) {

	res_body = fs.readFileSync(process.env.DISCOVERY_MANIFEST,'utf8');

	res.statusCode = 200;
	res.statusMessage = 'OK';

	res.write(res_body);

	res.end();
}
