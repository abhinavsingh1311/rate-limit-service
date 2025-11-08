const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    debug: process.env.APP_DEBUG === "true",
    logLevel: process.env.LOG_LEVEL || "info",
    appSecret: process.env.APP_SECRET || "",
    issuerBaseUrl: process.env.ISSUER_BASE_URL || '',
    audience: process.env.AUDIENCE || '',
    redisUrl: process.env.REDIS_URL

}

module.exports = {
    config
};