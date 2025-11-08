const { createClient } = require('redis');
const { config } = require('.');
const { Logger } = require('../utils/logger');

const client = createClient({
    url: config.redisUrl
});

client.on('error', err => console.log('Redis Client Error', err));

client.on('ready', () => {
    console.log('Redis connection successful');
})

const connect = async () => {
    try {
        await client.connect();
    } catch (err) {
        Logger.error(`Failed to connect to Redis: ${err.message}`);
        throw err;
    }
}


const disconnect = async () => {
    try {
        await client.quit();
    }
    catch (err) {
        Logger.error(`Failed to disconnect from Redis: ${err.message}`);
        await client.disconnect();
    }
}

const isRedisConnected = () => {
    return client.isOpen;
}

module.exports = {
    client,
    connect,
    disconnect,
    isRedisConnected
}

