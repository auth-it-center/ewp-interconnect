/** @file This file is responsible for keeping the database up-to-date, based on the last fetched catalogue from the registry. It contains  the functions:
* 1. clear_db : Clears the database collections.
* 2. createDB : Used to update the database.
* 3. init_db : This function is used to invoke the update process every INTERVAL seconds.
*/
let MongoClient = require('mongodb').MongoClient;
const connectionString = 'mongodb://' + process.env.MONGO_HOST + ':' + process.env.MONGO_PORT;
let db;
var convert = require('xml-js');
const downloader = require('./downloader.js')
const logger = downloader.logger;

/**
 * @description Clears the database collections in order to refresh them.
 * @param {object} db The database object containing the collecitons.
 * @async
 */
async function clear_db(db) {
    var collections = [process.env.INSTITUTIONS_COLLECTION, process.env.HOSTS_COLLECTION]
    try {
        collections.forEach(function(collection) {
            db.collection(collection).deleteMany({}, function(err, delOK) {
                if (err) throw err;
                // if (delOK) console.log(collection.charAt(0).toUpperCase() + collection.slice(1) + " collection deleted.");
            });
        })
    } catch {
        logger.warn("Deletion error: Collections " + collections + " does not exist");
    }
}

/**
 * @description Creates the database, after deletion, based on the new catalogue.
 * @async
 */
async function createDB() {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    db = client.db(process.env.MONGO_DB);
    await clear_db(db);
    var f = require('fs').readFileSync(process.env.CATALOGUE_FOLDER + "/" + process.env.CATALOGUE_XML, 'utf8');
    var options = {
        compact: true,
        ignoreComment: true,
        spaces: 4
    };
    var result = convert.xml2js(f, options);
    var hosts = result['catalogue']['host'];
    var institutions = result['catalogue']['institutions'];
    var binaries = result['catalogue']['binaries'];
    try {
        var admin_email;
        var client_certificate_hash;
        var client_rsa_public_hash;
        var server_rsa_public_hash;
        var institutions_covered = [];
        var rsa_public_key = '';
        var apis = [];
        for (i = 0; i < hosts.length; i++) {
            apis = [];
            if (hosts[i]['ewp:admin-email'] != undefined) {
                admin_email = hosts[i]['ewp:admin-email']._text;
            } else {
                admin_email = undefined;
            }
            if (hosts[i]['apis-implemented'] != undefined) {
                keys = Object.keys(hosts[i]['apis-implemented']);
                keys.forEach(function(key) {
                    api_url = key.split(':')[0] + ':url'
                    if (hosts[i]['apis-implemented'][key][api_url] != undefined) {
                        apis.push({
                            "api": key,
                            "url": hosts[i]['apis-implemented'][key][api_url]._text
                        });
                    }
                })
            }
            if (hosts[i]['client-credentials-in-use'] != undefined) {
                if (hosts[i]['client-credentials-in-use'].certificate != undefined) {
                    if (Array.isArray(hosts[i]['client-credentials-in-use'].certificate)) {
                        client_certificate_hash = [];
                        hosts[i]['client-credentials-in-use'].certificate.forEach(function(element) {
                            client_certificate_hash.push(element._attributes['sha-256']);
                        });
                    } else if (hosts[i]['client-credentials-in-use'].certificate._attributes['sha-256'] != undefined &&
                        !Array.isArray(hosts[i]['client-credentials-in-use'].certificate)) {
                        client_certificate_hash = '';
                        client_certificate_hash = hosts[i]['client-credentials-in-use'].certificate._attributes['sha-256'];

                    } else {
                        client_certificate_hash = undefined;
                    }
                } else {
                    client_certificate_hash = undefined;
                }
                if (hosts[i]['client-credentials-in-use']['rsa-public-key'] != undefined) {
                    if (Array.isArray(hosts[i]['client-credentials-in-use']['rsa-public-key'])) {
                        client_rsa_public_hash = [];
                        hosts[i]['client-credentials-in-use']['rsa-public-key'].forEach(function(element) {
                            client_rsa_public_hash.push(element._attributes['sha-256']);
                        });
                    } else if (!Array.isArray(hosts[i]['client-credentials-in-use']['rsa-public-key']) &&
                        hosts[i]['client-credentials-in-use']['rsa-public-key']._attributes['sha-256'] != undefined) {
                        client_rsa_public_hash = '';
                        client_rsa_public_hash = hosts[i]['client-credentials-in-use']['rsa-public-key']._attributes['sha-256'];
                        binaries['rsa-public-key'].forEach(function(element) {
                            if (element._attributes['sha-256'] == client_rsa_public_hash) {
                                rsa_public_key = element._text;
                            }
                        });
                    } else {
                        client_rsa_public_hash = undefined;
                    }
                } else {
                    client_rsa_public_hash = undefined;
                }
            } else {
                client_rsa_public_hash = undefined;
                client_certificate_hash = undefined;
            }
            if (hosts[i]['server-credentials-in-use'] != undefined) {
                if (hosts[i]['server-credentials-in-use']['rsa-public-key'] != undefined) {
                    server_rsa_public_hash = hosts[i]['server-credentials-in-use']['rsa-public-key']._attributes['sha-256'];
                } else {
                    server_rsa_public_hash = undefined;
                }
            } else {
                server_rsa_public_hash = undefined;
            }
            if (hosts[i]['institutions-covered'] != undefined) {
                if (Array.isArray(hosts[i]['institutions-covered']['hei-id'])) {
                    institutions_covered = [];
                    hosts[i]['institutions-covered']['hei-id'].forEach(function(element) {
                        institutions_covered.push(element._text);
                    });
                } else if (hosts[i]['institutions-covered'] != undefined &&
                    !Array.isArray(hosts[i]['institutions-covered']['hei-id'])) {
                    institutions_covered = [];
                    institutions_covered.push(hosts[i]['institutions-covered']['hei-id']._text);
                } else {
                    institutions_covered = [];
                }
            } else {
                institutions_covered = [];
            }
            db.collection(process.env.HOSTS_COLLECTION).insertOne({
                'host_id': i,
                'admin_email': admin_email,
                'institutions_covered': institutions_covered,
                'apis': apis,
                'client_rsa_public_hash': client_rsa_public_hash,
                'client_certificate_hash': client_certificate_hash,
                'server_rsa_public_hash': server_rsa_public_hash,
                'rsa_public_key': rsa_public_key
            });
        }
        var erasmus_code = '';
        var en_name = '';
        institutions.hei.forEach(function(element) {
            if (element['other-id'] != undefined) {
                if (element['other-id'][0] != undefined && element['other-id'][0]._attributes != undefined && element['other-id'][0]._attributes.type == 'erasmus') {
                    erasmus_code = element['other-id'][0]._text
                } else {
                    erasmus_code = undefined;
                }
            } else {
                erasmus_code = undefined;
            }
            if (Array.isArray(element.name)) {
                element.name.forEach(function(ele) {
                    if (ele._attributes['xml:lang'] == 'en') {
                        en_name = ele._text;
                    }
                });
            } else {
                if (element.name._attributes != undefined && element.name._attributes['xml:lang'] == 'en') {
                    en_name = element.name._text;
                }
            }
            db.collection(process.env.INSTITUTIONS_COLLECTION).insertOne({
                'hei_id': element._attributes.id,
                'erasmus_code': erasmus_code,
                'en_name': en_name
            });
        });
    } catch (err) {
        logger.error(err);
    } finally {
        client.close();
    }
};

/**
 * @description This function is used to invoke the update process every INTERVAL seconds, where INTERVAL is the homonym enviroment variable in the .env file.
 * The update process consists of the the actions with the following order:
 * 1. Fetch catalogue.xml from the regisrty
 * 2. Clear the database from the old data
 * 3. Insert to database the new data
 */
function init_db() {
    setInterval(async function() {
        logger.log("\n\n")
        logger.info("Log from :" + new Date());
        await downloader.get_catalogue().then(function(data) {}).catch(function(err) {
            var rescue = downloader.get_from_backup();
            if (rescue[0]) {
                logger.warn(err + '\nFailed to fetch catalogue from registry.\nFound previous catalogue.\nContinue with catalogue from : ' + rescue[1]);
            } else {
                logger.error("Could't fetch from registry.\n" + err + "\nAlso, couldn't fetch for backup file.\nNo catalogue file or backup exists.\nFATAL ERROR: No catalogue.\nExiting...");
                process.exit(1);
            }
        });
        await createDB();
        logger.info("Database successfully updated.");
    }, process.env.INTERVAL);
}
exports.init_db = init_db;
