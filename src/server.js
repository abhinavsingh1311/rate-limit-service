const express = require('express');
const cors = require('cors');
const { config } = require('./config/index');
const { requestLogger } = require('./middleware/requestLogger');
const helmet = require('helmet');
const healthRoutes = require('./routes/health');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandling');
const { Logger } = require('./utils/logger');
const { disconnect } = require('./config/redis');
const apiRoutes = require('./routes/api');

const createServer = () => {
    try {

        const server = express();

        server
            .use(helmet())
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .use(cors())
            .use(requestLogger)


        server.use('/health', healthRoutes);
        server.use('/api', apiRoutes);
        server.get('/', (req, res) => {
            res.send('<p>Hello!</p>');
        })



        //Error handling
        server
            .use(notFoundHandler)
            .use(globalErrorHandler)

        return server;
    }
    catch (ex) {
        Logger.warning(`Error setting up the server: ${ex}`);
    }
};

const gracefulShutdown = async (server) => {
    try {
        Logger.info("Shutting down gracefully");

        //TODO:  close redis connection later
        Logger.info('Closing redis connection....')
        await disconnect();
        //close express server
        if (server) {
            await new Promise((res, rej) => {
                server.close((err) => {
                    if (err) {
                        rej(err)
                        return;
                    }
                    res();
                })

            });

            Logger.info("Express Server closed");
        }

        //exits process(0)
        process.exit(0);
    }
    catch (err) {
        Logger.error(`Error during shutdown: ${err.message}`);
        process.exit(1);
    }
}

module.exports = {
    createServer,
    gracefulShutdown
}