const { config } = require('./config/index');
const { createServer, gracefulShutdown } = require('./server');
const { Logger } = require('./utils/logger');
const { connect } = require('./config/redis');

let server;

const indexServer = async () => {
    try {
        // Connect to Redis first
        Logger.info('Connecting to Redis...');
        await connect();

        // Then start Express server
        const app = createServer();
        server = app.listen(config.port, () => {
            Logger.info(`
                Server started successfully!
                Port: ${config.port}
                Environment: ${config.env}
                Time: ${new Date().toLocaleString()}
            `);
        });

        return server;
    }
    catch (error) {
        Logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

indexServer();