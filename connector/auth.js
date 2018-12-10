/** @file In this file is written the core functionality for authenticating the incoming requests. It contains  the function:
* 1. authenticate : The main function that used to authenticate the incoming requests.
*/
const httpSignature = require('http-signature');
const fs = require('fs');
const crypto = require('crypto');
const moment = require('moment');
const uuidv4 = require('uuidv4');
const db = require('./db.js');
const auth_helper = require('./helpers/auth_helper.js');
const host = process.env.HOST;
const server_priv = fs.readFileSync(process.env.SERVER_RSA_PRIVATE_KEY_PATH, 'utf8');
const server_pub = fs.readFileSync(process.env.SERVER_RSA_PUBLIC_KEY_PATH,'utf8');
const server_pub_rsa_hash = process.env.SERVER_RSA_PUBLIC_KEY_HASH;

/**
* @description This function is used to authenticate the incoming requests. Depending on the req, constructs the res and req_body objects.
* The authentication happens based on the specifications provided {@link https://github.com/erasmus-without-paper/ewp-specs-sec-srvauth-tlscert|here} and {@link https://github.com/erasmus-without-paper/ewp-specs-sec-srvauth-httpsig|here}
* @async
* @param {Object} req The request object.
* @param {Object} res The response object.
* @param {string} req_body The request body.
* @return {Object} auth Returns an object containing the method and the hash.
*/
async function authenticate(req, res, req_body) {

	var auth = {
		method : '',
		hash : ''
	};

	res.statusCode = 200;
	res.statusMessage = 'OK';


	var client_cert = '';
	var req_keyid = '';
	var date_header_name = '';


	//save the client certificate to client_cert
	if (Object.keys(req.socket.getPeerCertificate()).length != 0) {

		client_cert = req.socket.getPeerCertificate().fingerprint256.replace(/:/g,'').toLowerCase();

		//check if the certificate exists in the discovery manifest
		var cert_exists = await db.cert_hash_exist(client_cert);

		//if the certificate doesnt exist, the request is invalid
		if (cert_exists == 0) {

			res.statusCode = 401;
			res.statusMessage = 'non-valid certificate';
		}
		else {
			auth.method = 'cert';
			auth.hash = client_cert;
		}
	}

	if (res.statusCode == 200) {
		//if there is no certificate and no authorisation header return 401
		if (Object.keys(req.socket.getPeerCertificate()).length === 0 && req.headers['authorization'] == null) {
			res.statusCode = 401;
			res.statusMessage = 'no authorisation';
		}
		//if 'authorization' header doesnt exist, the the request isn't signed and we skip the following part
		else if (req.headers['authorization'] != null){

			var auth_header = req.headers['authorization'];
			var req_digest = '';

			//Create request digest
			req_digest = auth_helper.sha_256_digest(req_body);
			//this array contains all the headers required to be signed in the http-signature
			var required_headers =['x-request-id', 'digest', 'host', '(request-target)'];

			//if the request contains 'original-date' we require it to be signed in place of 'date'
			if (req.headers['original-date'] != null) {
				required_headers.push('original-date');
				date_header_name = 'original-date';
			}
			else {
				required_headers.push('date');
				date_header_name = 'date';

			}

			try {
				//if the httpSignature.parseRequest fails, there is a problem, i.e. missing required headers
				var parsed = httpSignature.parseRequest(req, {
					headers: required_headers
				});
			}
			catch(e) {
				res.statusCode = 401;
				res.statusMessage = 'http-signature error';
				// console.log(e);
			}

			if (res.statusCode == 200) {

				//extract keyId from authorization header
				req_keyid = auth_helper.get_keyid_from_header(auth_header);
				//check if the keyId exists in the manifest(keyId is the public rsa key hash of the client)
				var keyId_exists = await db.rsa_hash_exist(req_keyid);

				if (keyId_exists != 0) {
					auth.method = 'RSA';
					auth.hash = req_keyid;
				}

				var rsa_pub_key = '';
				var valid_signature = false;

				try {
					//get the rsa public key that corresponds to the hash provided in the keyId
					var rsa_pub_key_temp = await db.get_rsa_key_from_hash(req_keyid);
					rsa_pub_key = '-----BEGIN PUBLIC KEY-----';
					rsa_pub_key += rsa_pub_key_temp[0].replace(/ /g,'')
					rsa_pub_key += '-----END PUBLIC KEY-----';
				} catch(e) {
			 	// console.log(e);
				}

				try {
					//verify the request http-signature
					valid_signature = httpSignature.verifySignature(parsed, rsa_pub_key);
				}
				catch(e) {
					res.statusCode = 403;
					res.statusMessage = 'http-signature validation error';
					// console.log(e);
				}

				//check if the request-id was used in the previous 5 minutes
				var request_id_exist = await db.request_id_exist(req.headers['x-request-id']);

				//if not then save it for 5 minutes
				if(request_id_exist == 0){
					db.insert_request_id(req.headers['x-request-id']);
				}

				//check if the keyId exists and if not return the appropriate response code
				if (keyId_exists == 0) {
					res.statusCode = 401;
					res.statusMessage = 'invalid keyId';
				}
				//check if the http-signature is valid and if not return the appropriate response code
				else if (!valid_signature) {
					res.statusCode = 401;
					res.statusMessage = 'http-signature validation failed';
				}
				//check if the x-request-id existed in the request and if not return the appropriate response code
				else if (req.headers['x-request-id'] == null){
					res.statusCode = 400;
					res.statusMessage = 'no request-id header';
				}
				//check if the x-request-id is at the uuidv4 format and if not return the appropriate response code
				else if (!uuidv4.is(req.headers['x-request-id'])) {
					res.statusCode = 400;
					res.statusMessage = 'invalid request-id header';
				}
				//check if the x-request-id was used in last 5 minutes and if it was return the appropriate response code
				else if (request_id_exist > 0) {
					res.statusCode = 400;
					res.statusMessage = 'request-id used';
				}
				//check if the host header is the same with our host name and if not return the appropriate response code
				else if (req.headers['host'] != host) {
					res.statusCode = 401;
					res.statusMessage = 'no valid host header';
				}
				//check if the date header exists and if not return the appropriate response code
				else if (req.headers[date_header_name] == null){
					res.statusCode = 400;
					res.statusMessage = 'no date header';
				}
				//check if the timestamp of the client is within 5 minutes of our current time and if not return the appropriate response code
				else if (moment().diff(moment.utc(req.headers[date_header_name])) > 300000) {
					res.statusCode = 400;
					res.statusMessage = 'request timed out';
				}
				//check if the digest header exists and if not return the appropriate response code
				else if (req.headers['digest'] == null) {
					res.statusCode = 400;
					res.statusMessage = 'missing digest';
				}
				//check if the digest header value in the request is the same with the digest of the request body we created and if not return the appropriate response code
				else if (req.headers['digest'].toLowerCase().includes(req_digest.toLowerCase()) == false) {
					res.statusCode = 400;
					res.statusMessage = 'invalid digest';
				}
			}
		}
	}

	//return the auth object which contains the authorisation method used by the client and the certificate hash or rsa
	//public key hash, dependimg on the auth method, which is used to identify the client
	return auth;
}

exports.authenticate = authenticate
