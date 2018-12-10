/** @file This file is responsible for creating a logger object, that is used to keep log files. It contains  the functions:
* 1. create_logger : Creates the logger object.
*/
const log = require('simple-node-logger');
const Path = require('path');
const Fs = require('fs');

/**
* @description Returns a rolling file logger based on args or enviroment variables.
* @param {string} folder The full path of the folder.
* @param {string} file_name_patern The rolling file names patern.
* @param {string} date_format The date format in the patern.
* @param {string} The timestamp in each log.
* @returns {object} The rolling file logger object.
*/
function create_logger(folder, file_name_patern, date_format, timestamp_format) {
    const path = Path.resolve(process.env.LOGS_FOLDER);
    if (folder) {
        Fs.mkdirSync(folder);
    } else if (!Fs.existsSync(path) && !folder) {
        Fs.mkdirSync(path);
    }
    const opts = {
        logDirectory: folder || process.env.LOGS_FOLDER,
        fileNamePattern: file_name_patern || process.env.FILE_NAME_PATERN,
        dateFormat: date_format || process.env.DATE_FORMAT,
        timestampFormat: timestamp_format || process.env.TIMESTAMP_FORMAT
    };
    return log.createRollingFileLogger(opts);
}

exports.create_logger = create_logger;
