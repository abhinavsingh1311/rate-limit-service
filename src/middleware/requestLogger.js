const { Logger } = require("../utils/logger")

const requestLogger = (req, res, next) => {
    const tz = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - tz;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} -${duration}ms`

        if (res.statusCode >= 500) {
            Logger.error(message);
        } else if (res.statusCode >= 400) {
            Logger.warning(message);
        } else {
            Logger.info(message);
        }
    });

    next();
}

module.exports = {
    requestLogger
}