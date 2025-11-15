const { client, connect } = require('../config/redis');
const { Logger } = require('../utils/logger');

const testRedis = async () => {
    try {
        Logger.info('Testing Redis connection...');
        await connect();

        Logger.info('Setting test key...');
        await client.set('test:key', 'Hello Redis!');

        Logger.info('Getting test key...');
        const value = await client.get('test:key');
        Logger.info(`Retrieved value: ${value}`);

        Logger.info('Deleting test key...');
        await client.del('test:key');

        Logger.info(' Redis test successful!');
        process.exit(0);
    } catch (error) {
        Logger.error(`Redis test failed: ${error.message}`);
        Logger.error(error.stack);
        process.exit(1);
    }
};

testRedis();