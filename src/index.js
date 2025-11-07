const { config } = require('./config/index');
const { connect } = require('./config/redis');
const { createServer, gracefulShutdown } = require('./server');
const { Logger } = require('./utils/logger');

let server;

const indexServer = async () => {
    try {

        Logger.info('Connecting to redis....');
        await connect();

        const app = createServer();
        server = app.listen(config.port, () => {
            Logger.info(`
                Server started successfully!
                Port: ${config.port}
                Environment:${config.env}
                Time: ${new Date().toLocaleString()}
                `);
        });

        return server;
    }
    catch (error) {
        Logger.error(`Failed to start server : ${error.message}`);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

indexServer();