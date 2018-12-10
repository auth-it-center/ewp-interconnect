/** @file This file is a helper for the auth.js file. It contains the functions:
* 1. sha_256_digest : This function is used to create the SHA-256 of the request body in base64 encoding.
* 2. get_keyid_from_header : This function is used to extract the keyID from the http-signature header.
*/
const crypto = require('crypto');

/**
* @description This function is used to create the SHA-256 of the request body in base64 encoding.
* @param {string} req_body The request body.
* @return {string} The SHA-256 of the request body in base64 encoding.
*/
function sha_256_digest(req_body){
    var hash = crypto.createHash('sha256');
    hash.update(req_body);
    return 'SHA-256=' +  hash.digest('base64');
};

/**
* @description This function is used to extract the keyID from the http-signature header.
* @param {string} auth_header The authentication header.
* @return {string} The keyID.
*/
function get_keyid_from_header(auth_header){
    var start_index = auth_header.search('keyId="') + 'keyId="'.length;
    var end_index = auth_header.indexOf('",', start_index);
    return auth_header.substring(start_index,end_index);
};

exports.sha_256_digest = sha_256_digest
exports.get_keyid_from_header = get_keyid_from_header
