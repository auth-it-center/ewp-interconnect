/**
* @file This file is responsible for handling the requests of the institutions api. It contains the functions:
* 1. institutions_get : The handler of the GET request in the institutions API.
* 2. institutions_post : The handler of the POST request in the institutions API.
*/
var response = require('./../../connector/respond.js');
var auth = require('./../../connector/auth.js');

/**
 * @description This function is used to handle GET requests of the institutions API according to {@link https://github.com/erasmus-without-paper/ewp-specs-api-institutions|here}.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
 exports.institutions_get = async function(req, res) {
 	var req_body = '';
 	var res_body = '';
 	await auth.authenticate(req, res, req_body);

 	if (res.statusCode == 200) {
 		if (url.parse(req.url).query != null && url.parse(req.url).query.split('&').length == 1) {
 			var query = url.parse(req.url).query.split('=');
 			if (query[0] == 'hei_id') {
 				if (query[1] == 'auth.gr') {
 					var res_body = fs.readFileSync(process.env.INSTITUTIONS_XML, 'utf8');
 				}
 			}
 			else {
 				res.statusCode = 400;
 				res.statusMessage = 'bad request';
 			}
 		}
 		else {
 			res.statusCode = 400;
 			res.statusMessage = 'bad request';
 		}
 	}
 	await response.respond(req, res, res_body);
 };

/**
 * @description This function is used to handle GET requests of the institutions API according to {@link https://github.com/erasmus-without-paper/ewp-specs-api-institutions|here}.
 * We only accept parameters in the post request in application/x-www-form-urlencoded format
 * according to {@link https://github.com/erasmus-without-paper/ewp-specs-api-institutions#request-parameters}
 *
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
 exports.institutions_post = async function(req, res) {

 	var req_body = '';
 	var res_body = '';
 	req.on("data", function(data) {
 		req_body = req_body + data;
 	});
 	req.on("end", async function(data) {
 		await auth.authenticate(req, res, req_body);

 		if (res.statusCode == 200) {
 			if (url.parse(req.url).query != null && url.parse(req.url).query.split('&').length == 1) {
 				var query = url.parse(req.url).query.split('=');
 				if (query[0] == 'hei_id') {
 					if (query[1] == 'auth.gr') {
 						var res_body = fs.readFileSync(process.env.INSTITUTIONS_XML, 'utf8');
 					}
 				}
 				else {
 					res.statusCode = 400;
 					res.statusMessage = 'bad request';
 				}
 			}
 			else {
 				res.statusCode = 400;
 				res.statusMessage = 'bad request';
 			}
 		}

 		await response.respond(req, res, res_body);
 	});
 };
