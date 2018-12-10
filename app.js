/** @file This is the main file. It starts the update process of the database and the HTTPS server. */
const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const routes = require('./APIs/routes.js');
const updater = require('./updater/updater.js')

//start the update process of the database
updater.init_db();

const ip = process.env.HOST;
const port = process.env.PORT;

const options = {
	cert: fs.readFileSync(process.env.SERVER_CERTIFICATE_PATH),
	key: fs.readFileSync(process.env.SERVER_RSA_PRIVATE_KEY_PATH),
	requestCert: true,
	rejectUnauthorized: false
};

//create an https server with the options from app
var server = https.createServer(options, app).listen(port, ip);
console.log("listening at " + ip + ":" + port);

//Pass app to the routes
routes(app);
