/**
* @file This file is responsible for handling the requests of the echo api. It contains the functions:
* 1. echo_get : The handler of the GET request in the echo API.
* 2. echo_post : The handler of the POST request in the echo API.
*/
var response = require('./../../connector/respond.js');
var authenticator = require('./../../connector/auth.js');
const db = require('./../../connector/db.js');
var url = require('url');

const res_intro =
    `<?xml version="1.0" encoding="utf-8"?>
<response
xmlns="https://github.com/erasmus-without-paper/ewp-specs-api-echo/tree/stable-v2"
xmlns:xml="http://www.w3.org/XML/1998/namespace"
xsi:schemaLocation="https://github.com/erasmus-without-paper/ewp-specs-api-echo/tree/stable-v2 schema.xsd"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`;

/**
 * @description This function is used to handle GET requests of the echo API according to {@link https://github.com/erasmus-without-paper/ewp-specs-api-echo|here}.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
async function echo_get(req, res) {

    var req_body = '';
    var res_body = '';
    var auth = await authenticator.authenticate(req, res, req_body);

    if (res.statusCode == 200) {
        var hei_ids = "<hei-id>";
        if (auth.method == 'RSA') {
            var db_heis = await db.get_heis_from_rsa_hash(auth.hash);
            hei_ids = hei_ids + db_heis[0].join('</hei-id>' + "\n" + '<hei-id>') + "</hei-id>";
        } else if (auth.method == 'cert') {
            var db_heis = await db.get_heis_from_cert_hash(auth.hash);
            hei_ids = hei_ids + db_heis[0].join('</hei-id>' + "\n" + '<hei-id>') + "</hei-id>";
        }
        res_body = res_intro + hei_ids;
        if (url.parse(req.url).query != null) {
            url.parse(req.url).query.split('&').forEach(function(elem) {
                res_body += '\n<echo>' + elem.split('=')[1] + '</echo>';
            });
        }
        res_body += '\n</response>'
    }
    await response.respond(req, res, res_body);
};

/**
 * @description This function is used to handle POST requests of the echo API according to {@link https://github.com/erasmus-without-paper/ewp-specs-api-echo|here}.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 */
async function echo_post(req, res) {

    var req_body = '';
    var res_body = '';
    req.on("data", function(data) {
        req_body = req_body + data;
    });
    req.on("end", async function(data) {
        var auth = await authenticator.authenticate(req, res, req_body);

        if (res.statusCode == 200) {

            var hei_ids = "<hei-id>";
            if (auth.method == 'RSA') {
                var db_heis = await db.get_heis_from_rsa_hash(auth.hash);
                hei_ids = hei_ids + db_heis[0].join('</hei-id>' + "\n" + '<hei-id>') + "</hei-id>";
            } else if (auth.method == 'cert') {
                var db_heis = await db.get_heis_from_cert_hash(auth.hash);
                hei_ids = hei_ids + db_heis[0].join('</hei-id>' + "\n" + '<hei-id>') + "</hei-id>";
            }
            res_body = res_intro + hei_ids;
            if (req_body != "") {
                req_body.split('&').forEach(function(elem) {
                    res_body += '\n<echo>' + elem.split('=')[1] + '</echo>';
                });
            }
            res_body += '\n</response>'
        }
        await response.respond(req, res, res_body);
    });
};

exports.echo_get = echo_get
exports.echo_post = echo_post
