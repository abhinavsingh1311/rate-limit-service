const { client } = require("../config/redis");
const rateLimiter = require("../services/rateLimiter");
const { Logger } = require("../utils/logger");

const TENANT_STORE = {
    'test-free-key-123': { id: 'tenant-1', tier: 'free', name: 'Test Free User' },
    'test-premium-key-456': { id: 'tenant-2', tier: 'premium', name: 'Test Premium User' },
    'test-enterprise-key-789': { id: 'tenant-3', tier: 'enterprise', name: 'Test Enterprise User' }
};

const getTenantFromApiKey = async (apiKey) => {
    try {
        // const tenant = client.query("SELECT id FROM tenants where api_key=?", apiKey);
        const tenant = TENANT_STORE[apiKey];

        return tenant;

    }
    catch (err) {
        Logger.error(`Error: ${err}`);
        return null;
    }

}

const rateLimiterMiddleware = async (req, res, next) => {
    const apiKey = req.get('X-API-Key') || req.headers['x-api-key'];
    if (!apiKey) {
        Logger.warning('Request missing API key');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required. Please provide X-API-Key header.'
        });
    }

    const tenant = await getTenantFromApiKey(apiKey);
    if (!tenant) {
        Logger.warning(`Invalid API key attempted: ${apiKey.substring(0, 10)}...`);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key'
        });
    }

    const tier = tenant.tier || 'free';
    const tenantId = tenant.id;

    Logger.info(`[${tenantId}] Rate limit check - Tier: ${tier}`);


    try {
        const result = await rateLimiter.checkRateLimit(tenant, tier);
        res.set({
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
            "X-RateLimit-Reset": result.resetTime
        })

        if (!result.allowed) {
            Logger.warning(`[${tenantId}] Rate limit exceeded`);

            res.set('Retry-After', result.retryAfter);

            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
                limit: result.limit,
                remaining: result.remaining,
                retryAfter: result.retryAfter,
                resetTime: result.resetTime
            });
        }
        next();
    }

    catch (ex) {
        Logger.error(`Error fetching results:${ex.message}`);
        return next();
    }


}

module.exports = {
    rateLimiterMiddleware,
    getTenantFromApiKey,
    TENANT_STORE
};