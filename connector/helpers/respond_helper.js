/** @file This file is a helper for the respond.js and the method_not_allowed.js files. It contains  the functions:
* 1. create_x_request_sign_header : This function is used to create the x-request-signature header.
* 2. create_digest_header : This function is used to create the digest header.
*/
const crypto = require('crypto');

/**
* @description This function is used to create the x-request-signature header.
* @param {string} auth_header The authorization header.
* @param {Array} headers The headers array to be signed.
* @param {Object} res The response object.
*/
function create_x_request_sign_header(auth_header,headers,res){
    var start_index = auth_header.search(',signature="') + ',signature="'.length;
    var end_index = auth_header.indexOf('"', start_index)
    res.setHeader('x-request-signature', auth_header.substring(start_index,end_index));
    headers.push('x-request-signature');
};

/**
* @description This function is used to create the digest header.
* @param {Array} headers The header array to be signed.
* @param {string} not_allowed_response The xml response.
* @param {Object} res The response object.
*/
function create_digest_header(headers,res_body,res){
    var hash = crypto.createHash('sha256');
    hash.update(res_body);
    res.setHeader('digest', 'SHA-256=' +  hash.digest('base64'));
    headers.push('digest');
};

exports.create_digest_header = create_digest_header
exports.create_x_request_sign_header = create_x_request_sign_header
