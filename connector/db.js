/** @file In this file are written the queries to the database. It contains  the functions:
* 1. cert_hash_exist : Given a certificate hash, returns the number of records maching the certificate hash.
* 2. rsa_hash_exist : Given a RSA hash, returns the number of records maching the RSA hash.
* 3. get_rsa_key_from_hash : Given a RSA hash, returns the macthed RSA keys or empty Array.
* 4. get_heis_from_rsa_hash : Given a RSA hash, returns an Array with the HEI-IDs or empty Array.
* 5. get_heis_from_cert_hash : Given a certificate hash, returns an Array with the HEI-IDs or empty Array.
* 6. insert_request_id : Inserts the request_id in the database.
* 7. request_id_exist : Checks if the request id exists in the database.
*/
const MongoClient = require('mongodb').MongoClient;
const connectionString = 'mongodb://'+process.env.MONGO_HOST+':'+process.env.MONGO_PORT;

/**
* @description Given a certificate hash, returns the number of records maching the certificate hash.
* @param {string} cert_hash The certificate hash.
* @returns {number} The number of records or 0.
* @async
* @example
*    cert_hash_exist("1994a5c11fab6a1e951587bebe76beacba4226d0137001d65d2a792896c1fd12").then(function(result) {
*        console.log(result);
*    }).catch(err => console.error(err));
*/
async function cert_hash_exist(cert_hash) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });

    let db = client.db(process.env.MONGO_DB);
    try {
        var res = await db.collection(process.env.HOSTS_COLLECTION).countDocuments({
            client_certificate_hash: cert_hash
        });
    } finally {
        client.close();
        return res;
    }
};

/**
* @description Given a RSA hash, returns the number of records maching the RSA hash.
* @param {string} rsa_hash The RSA hash.
* @returns {number} The number of records or 0.
* @async
* @example
*   rsa_hash_exist("2eb56a32d56675d01d3f2eabeca80439935aba548f41a415973158a4abcbe795").then(function(result) {
*       console.log(result);
*   }).catch(err => console.error(err));
*/
async function rsa_hash_exist(rsa_hash) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    let db = client.db(process.env.MONGO_DB);
    try {
        var res = await db.collection(process.env.HOSTS_COLLECTION).countDocuments({
            client_rsa_public_hash: rsa_hash
        });
    } finally {
        client.close();
        return res;
    }
};

/**
* @description Given a RSA hash, returns the macthed RSA keys or empty Array.
* @param {string} rsa_hash The RSA hash.
* @returns {Array} The macthed RSA keys or empty Array.
* @async
* @example
*   get_rsa_key_from_hash("2eb56a32d56675d01d3f2eabeca80439935aba548f41a415973158a4abcbe795").then(function(result) {
*       console.log(result);  // prints the key in ""
*       console.log(result[0]);  // prints the key evaluating the speacial chars like '\n'
*   }).catch(err => console.error(err));
*/
async function get_rsa_key_from_hash(rsa_hash) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    let db = client.db(process.env.MONGO_DB);
    var output = [];
    try {
        var res = await db.collection(process.env.HOSTS_COLLECTION).find({
            client_rsa_public_hash: rsa_hash
        }, {
            _id: 0
        }).forEach(function(doc) {
            output.push(doc.rsa_public_key)
        });
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
        return output;
    }
};

/**
* @description Given a RSA hash, returns an Array with the HEI-IDs or empty Array.
* @param {string} rsa_hash The RSA hash.
* @returns {Array} The macthed RSA keys or empty Array.
* @async
* @example
*   get_heis_from_rsa_hash("d85e663147ec92dcfb98de1fc94dd41d2c846fdaa4301f46e6ea3774af064d40").then(function(result) {
*       console.log(result); // prints a list of lists
*       console.log(result[0]); // need only the element at 0
*   }).catch(err => console.error(err));
*/
async function get_heis_from_rsa_hash(rsa_hash) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    let db = client.db(process.env.MONGO_DB);
    var output = [];
    try {
        var res = await db.collection(process.env.HOSTS_COLLECTION).find({
            client_rsa_public_hash: rsa_hash
        }, {
            _id: 0
        }).forEach(function(doc) {
            output.push(doc.institutions_covered)
        });
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
        return output;
    }
};

/**
* @description Given a certificagte hash, returns the macthed HEI IDs or empty Array.
* @param {string} cert_hash The certificate hash.
* @returns {Array} The macthed HEI IDs or empty Array.
* @async
* @example
*   get_heis_from_cert_hash("1f4ed36ab99fb859e71c27282b95a46b7d7482702b86a73203958eb1c7146508").then(function(result) {
*       console.log(result); // prints a list of lists
*       console.log(result[0]); // need only the element at 0
*   }).catch(err => console.error(err));
*/
async function get_heis_from_cert_hash(cert_hash) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    let db = client.db(process.env.MONGO_DB);
    var output = [];
    try {
        var res = await db.collection(process.env.HOSTS_COLLECTION).find({
            client_certificate_hash: cert_hash
        }, {
            _id: 0
        }).forEach(function(doc) {
            output.push(doc.institutions_covered)
        });
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
        return output;
    }
};

/**
* @description Inserts the request_id in the database and the its creation date, in order to delete after 5 minutes.
* @param {string} request_id The request_id.
* @async
* @example
*   insert_request_id("11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000").then(function() {
*       console.log("inserted");
*   }).catch(err => console.error(err));
*/
async function insert_request_id(request_id) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });
    let db = client.db(process.env.MONGO_DB);
    try {
        var res = await db.collection(process.env.REQUESTS_COLLECTION).insertOne({
            createdAt: new Date(),
            request_id: request_id
        });
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
    }
};

/**
* @description Given a request id, returns the number of records maching that id.
* @param {string} request_id The request id.
* @returns {number} The number of records or 0.
* @async
* @example
*   request_id_exist("11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000").then(function() {
*       console.log("inserted");
*   }).catch(err => console.error(err));
*/
async function request_id_exist(request_id) {
    let client = await MongoClient.connect(connectionString, {
        useNewUrlParser: true
    });

    let db = client.db(process.env.MONGO_DB);
    try {
        var res = await db.collection(process.env.REQUESTS_COLLECTION).countDocuments({
            request_id: request_id
        });
    } finally {
        client.close();
        return res;
    }
};

exports.cert_hash_exist = cert_hash_exist;
exports.rsa_hash_exist = rsa_hash_exist;
exports.get_rsa_key_from_hash = get_rsa_key_from_hash;
exports.get_heis_from_rsa_hash = get_heis_from_rsa_hash;
exports.get_heis_from_cert_hash = get_heis_from_cert_hash;
exports.insert_request_id = insert_request_id;
exports.request_id_exist = request_id_exist;
