
const { config } = require('../config/index');
const { Logger } = require("../utils/logger");


const notFoundHandler = (req, res, next) => {

    Logger.warning(`404 Page not found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'not found',
        path: req.path,
        method: req.method
    });

};

// global erorr handler 

const globalErrorHandler = (error, req, res, next) => {
    Logger.error(`Error: ${error.message}\nStack:${error.stack}`);

    const statusCode = error.status || error.statusCode;

    const errorMessage = {
        error: error.message,
        status: statusCode
    };

    if (config.env == 'development') {
        errorMessage.stack = error.stack;
    }

    res.status(statusCode).json(errorMessage);
};

module.exports = {
    notFoundHandler, globalErrorHandler
}