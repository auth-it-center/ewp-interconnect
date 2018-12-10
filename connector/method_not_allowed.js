/** @file In this file is written the handler for the incoming requests that use inappropriate method. It contains  the function:
* 1. method_not_allowed : The use of this function is used to create the response to the methods that are not allowed.
*/
const httpSignature = require('http-signature');
const fs = require('fs');
const crypto = require('crypto');
const respond_helper = require('./helpers/respond_helper.js');
const server_priv = fs.readFileSync(process.env.SERVER_RSA_PRIVATE_KEY_PATH, 'utf8');
const server_pub = fs.readFileSync(process.env.SERVER_RSA_PUBLIC_KEY_PATH,'utf8');
const server_pub_rsa_hash = process.env.SERVER_RSA_PUBLIC_KEY_HASH;

/**
* @description The use of this function is used to create the response to the methods that are not allowed.
* @param {Object} req The request object.
* @param {Object} res The response object.
* @async
*/
async function method_not_allowed(req, res){

	res.statusCode = 405;
	res.statusMessage = 'Method Not Allowed';

	const not_allowed_response =
	`<?xml version="1.0" encoding="utf-8"?>
	<error-response
	xmlns:xml="http://www.w3.org/XML/1998/namespace"
	xmlns="https://github.com/erasmus-without-paper/ewp-specs-architecture/blob/stable-v1/common-types.xsd"
	xsi:schemaLocation="https://github.com/erasmus-without-paper/ewp-specs-architecture/blob/stable-v1/common-types.xsd schema.xsd"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<developer-message
	xsi:type="MultilineStringWithOptionalLang"
	xml:lang="en-GB">
	Method Not Allowed
	</developer-message>
	<user-message
	xml:lang="en-GB">
	Method Not Allowed
	</user-message>
	</error-response>`;

	var headers = [];

	//Create date header
	var date = (new Date()).toUTCString();
	res.setHeader('date', date);
	headers.push('date');

	respond_helper.create_digest_header(headers,not_allowed_response,res);
	if (req.headers['authorization'] != null){
		//extract request signature from authorization header and return it in 'x-request-signature'
		var auth_header = req.headers['authorization'];
		respond_helper.create_x_request_sign_header(auth_header,headers,res);
	}

	//Create x-request-id header
	if (req.headers['x-request-id'] != null) {
		res.setHeader('x-request-id',req.headers['x-request-id']);
		headers.push('x-request-id');
	}

	//if 'accept-signature' header has 'rsa-sha256', sign the response
	if (req.headers['accept-signature'] != null && req.headers['accept-signature'].search('rsa-sha256') != -1) {
		httpSignature.sign(res, {
			key:  server_priv,
			keyId: server_pub_rsa_hash,
			headers: headers
		});
		res.setHeader('signature', res.getHeader('authorization').substring(10));
		res.removeHeader('authorization');
	}
	res.write(not_allowed_response);
	res.end();
}

exports.method_not_allowed = method_not_allowed
