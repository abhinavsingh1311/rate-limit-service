const winston = require('winston');
const { config } = require('../config/index');

const LogLevels = {
    error: 0,
    warning: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const Logger = winston.createLogger({
    levels: LogLevels,
    level: config.logLevel,
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        winston.format.printf(
            ({ timestamp, level, message, stack }) => {
                return (`${timestamp} ${level}: ${message} ${stack || ""}`)
            }
        )
    ),
    transports: [new winston.transports.Console()]
});

module.exports = {
    Logger
}