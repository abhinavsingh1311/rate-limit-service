const crypto = require('crypto');
const { client } = require('../config/redis');


const generateApiKey = (prefix = 'sk_test') => {
    const randomBytes = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${randomBytes}`;
};

const apiKeyExists = async (apiKey) => {
    const exists = await client.exists(`tenant:${apiKey}`);
    return exists == 1;
};

const generateUniqueApiKey = async (prefix = 'sk_test', maxRetries = 5) => {
    try {
        for (let i = 0; i < maxRetries; i++) {
            const apiKey = generateApiKey(prefix);
            const exists = await apiKeyExists(apiKey);

            if (!exists) {
                return apiKey;
            }
        }

        throw new Error('Failed to generate unique API key after maximum retries');
    } catch (error) {
        Logger.error(`Error in generateUniqueApiKey: ${error.message}`);
        Logger.error(`Stack: ${error.stack}`);
        throw error;
    }
};

module.exports = {
    generateApiKey,
    apiKeyExists,
    generateUniqueApiKey
}