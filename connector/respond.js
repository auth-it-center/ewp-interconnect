/** @file This file is responsible for constucting the response of the server. It contains  the function:
* 1. respond : The use of this function is used to create the response for the incoming requests.
*/
const httpSignature = require('http-signature');
const fs = require('fs');
const crypto = require('crypto');
const respond_helper = require('./helpers/respond_helper.js');
const host = process.env.HOST;
const server_priv = fs.readFileSync(process.env.SERVER_RSA_PRIVATE_KEY_PATH, 'utf8');
const server_pub = fs.readFileSync(process.env.SERVER_RSA_PUBLIC_KEY_PATH,'utf8');
const server_pub_rsa_hash = process.env.SERVER_RSA_PUBLIC_KEY_HASH;

/**
* @description The use of this function is used to create the response for the incoming requests.
* @param {Object} req The request object.
* @param {Object} res The response object.
* @param {string} res_body The response body.
* @async
*/
async function respond(req, res, res_body) {

	var headers = [];

	var error_response =
	`<?xml version="1.0" encoding="utf-8"?>
	<error-response
	xmlns:xml="http://www.w3.org/XML/1998/namespace"
	xmlns="https://github.com/erasmus-without-paper/ewp-specs-architecture/blob/stable-v1/common-types.xsd"
	xsi:schemaLocation="https://github.com/erasmus-without-paper/ewp-specs-architecture/blob/stable-v1/common-types.xsd schema.xsd"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;

	if (res.statusCode != 200) {

		error_response += `<developer-message
		xsi:type="MultilineStringWithOptionalLang"
		xml:lang="en-GB">` +
		res.statusMessage +
		`</developer-message>
		<user-message
		xml:lang="en-GB">` +
		res.statusMessage +
		`</user-message>
		</error-response>`;

		res_body = error_response;

		res.setHeader('WWW-Authenticate', 'echo=' + res.statusMessage);
		headers.push('WWW-Authenticate');
		res.setHeader('want-digest', 'SHA-256');
		headers.push('want-digest');
	}

	if (req.headers['authorization'] != null) {

		var auth_header = req.headers['authorization'];
		//extract request signature from authorization header and return it in 'x-request-signature'
		respond_helper.create_x_request_sign_header(auth_header,headers,res);
	}

	//Create digest header
	respond_helper.create_digest_header(headers,res_body,res);
	//Create date header
	var date = (new Date()).toUTCString();
	res.setHeader('date', date);
	headers.push('date');

	//Create x-request-id header
	if (req.headers['x-request-id'] != null) {
		res.setHeader('x-request-id',req.headers['x-request-id']);
		headers.push('x-request-id');
	}

	//Sign the response
	if (req.headers['accept-signature'] != null && req.headers['accept-signature'].search('rsa-sha256') != -1) {
		httpSignature.sign(res, {
			key:  server_priv,
			keyId: server_pub_rsa_hash,
			headers: headers
		});
		res.setHeader('signature', res.getHeader('authorization').substring(10));
		res.removeHeader('authorization');
	}
	res.write(res_body);
	// console.log(res.statusCode,res.statusMessage);
	res.end();
}

exports.respond = respond
