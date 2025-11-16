const { createClient } = require('redis');
const { config } = require('./index');
const { Logger } = require('../utils/logger');

const client = createClient({
    url: config.redisUrl
});

client.on('error', err => Logger.error(`Redis Client Error: ${err.message}`));
client.on('connect', () => Logger.info('Redis connected successfully'));
client.on('ready', () => Logger.info('Redis client ready'));

let isConnected = false;

const connect = async () => {
    // Check if already connected to prevent double connection
    if (isConnected || client.isOpen) {
        Logger.info('Redis already connected, skipping reconnect');
        return;
    }

    try {
        await client.connect();
        isConnected = true;
        Logger.info('Redis connection established');
    } catch (err) {
        Logger.error(`Failed to connect to Redis: ${err.message}`);
        throw err;
    }
};

const disconnect = async () => {
    if (!isConnected && !client.isOpen) {
        Logger.info('Redis already disconnected');
        return;
    }

    try {
        await client.quit();
        isConnected = false;
        Logger.info('Redis client disconnected');
    } catch (err) {
        Logger.error(`Failed to disconnect from Redis: ${err.message}`);
    }
};


module.exports = {
    client,
    connect,
    disconnect
};