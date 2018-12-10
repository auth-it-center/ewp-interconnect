/** @file This file is responsible for fetching and maintaining a catalogue copy from the registry, localy. It contains  the functions:
* 1. create_backup : Creates a backup of the catalogue.xml.
* 2. catalogue_exists : Checks if the catalogue.xml exists.
* 3. get_from_backup : If the catalogue.xml does not exist get data from catalogue
* 4. get_catalogue : Fetches the catalogue from the regisrty.
*/
const Fs = require('fs');
const Path = require('path');
const Axios = require('axios');
const log = require('./logger.js');

logger = log.create_logger();

(function(){
    const path = Path.resolve(process.env.CATALOGUE_FOLDER);
    if (!Fs.existsSync(path)) {
        Fs.mkdirSync(path);
        logger.info("Created catalogue folder.\nContinuing...");
    } else {
        logger.warn("Folder catalogue already exists.\nContinuing...");
    }
})();


/**
* @description Creates a backup of the catalogue.xml, named catalogue.xml.bak.
* @return {boolean} Returns true if the operation executed successfully, either false.
*/
function create_backup() {
    const path = Path.resolve(process.env.CATALOGUE_FOLDER, process.env.CATALOGUE_XML);
    if (Fs.existsSync(path) && (Fs.statSync(path).size / 1000000.0) > 0) {
        Fs.copyFile(path, path + '.bak', (err) => {
            if (err) {
                return false;
            }
        });
    } else {
        return false;
    }
    return true;
}

/**
* @description Checks if the catalogue.xml exists.
* @return {boolean} Returns true if the catalogue.xml exists, either false.
*/
function catalogue_exists() {
    const path = Path.resolve(process.env.CATALOGUE_FOLDER, process.env.CATALOGUE_XML);
    if (Fs.existsSync(path) && (Fs.statSync(path).size / 1000000.0) > 0) {
        return true;
    } else {
        return false;
    }
}

/**
* @description If the catalogue.xml does not exist get data from catalogue.
* @return {boolean} Returns true if the catalogue.xml exists, either false.
*/
function get_from_backup() {
    const bak = Path.resolve(process.env.CATALOGUE_FOLDER, process.env.CATALOGUE_XML_BACKUP);
    const path = Path.resolve(process.env.CATALOGUE_FOLDER, process.env.CATALOGUE_XML);
    if (Fs.existsSync(bak) && (Fs.statSync(bak).size / 1000000.0) > 0) {
        Fs.copyFile(bak, process.env.CATALOGUE_FOLDER + "/" + process.env.CATALOGUE_XML, (err) => {
            if (err) {
                return [false, ''];
            }
        });
        return [true, bak]
    } else {
        if (catalogue_exists()) {
            Fs.copyFile(path, path + '.bak', (err) => {
                if (err) {
                    return [false, path];
                }
            });
            return [true, path];
        } else {
            return [false, ''];
        }

    }
}
/**
* @description Fetches the catalogue from the regisrty.
* @return {Promice} Returns a promise.
* @async
*/
async function get_catalogue() {
    const path = Path.resolve(process.env.CATALOGUE_FOLDER, process.env.CATALOGUE_XML);
    const url = process.env.DEV_CATALOGUE_XML_URL;
    const response = await Axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
    });
    if (response.status != 200) {
        if (get_from_backup()[0]) {
            resolve();
        } else {
            reject();
        }
    } else {
        response.data.pipe(Fs.createWriteStream(path));
    }
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            logger.info("Successfully fetch catalogue from regisrty.");
            if (create_backup()) {
                logger.info('Backup successfully created.');
            } else {
                logger.warn('No previous catalogue exists.\nBackup not created.');
            }
            resolve()
        })
        response.data.on('error', (err) => {
            if (get_from_backup()[0]) {
                resolve();
            } else {
                reject();
            }
        })
    })

}

exports.get_catalogue = get_catalogue
exports.get_from_backup = get_from_backup
exports.logger = logger

// setInterval(async function() {
//     await get_catalogue().then(function() {
//         console.log("Successfully updated the catalogue file.");
//     }).catch(function(err) {
//         var rescue = get_from_backup();
//         if (rescue[0]) {
//             console.log(err+'\nFailed to fetch catalogue from registry.\nFound previous catalogue.\nContinue with catalogue from : '+rescue[1]);
//         } else {
//             console.log("Could't fetch from registry.\n" + err+"\nAlso, couldn't fetch for backup file.\nNo catalogue file or backup exists.\nFATAL ERROR: No catalogue.\nExiting...");
//             process.exit(1);
//         }
//     });
// }, 5000);
