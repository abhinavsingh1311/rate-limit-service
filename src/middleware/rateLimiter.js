const { client } = require("../config/redis");
const rateLimiter = require("../services/rateLimiter");
const tenantService = require("../services/tenantService");
const { Logger } = require("../utils/logger");

const rateLimiterMiddleware = async (req, res, next) => {
    const apiKey = req.get('X-API-Key') || req.headers['x-api-key'];
    if (!apiKey) {
        Logger.warning('Request missing API key');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required. Please provide X-API-Key header.'
        });
    }

    const tenant = await tenantService.getTenantByApiKey(apiKey);
    if (!tenant) {
        Logger.warning(`Invalid API key attempted: ${apiKey.substring(0, 10)}...`);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key'
        });
    }

    if (!tenant.isActive) {
        Logger.warning(`Inactive tenant attempted access: ${tenant.id}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Your account has been deactivated. Please contact support.'
        });
    }

    const tier = tenant.tier;
    const tenantId = tenant.id;

    // Log the request for this tenant
    Logger.info(`[${tenantId}] Rate limit check - Tier: ${tier}, Name: ${tenant.name}`);


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
        req.tenant = tenant;
        Logger.info(`[${tenantId}] Request allowed - Remaining: ${result.remaining}`);

        next();
    }

    catch (ex) {
        Logger.error(`Rate limiter error: ${error.message}\nStack: ${error.stack}`);

        // Fail open: allow request but log error
        Logger.warning(`Allowing request due to rate limiter error (fail-open mode)`);
        return next();
    }


}

module.exports = {
    rateLimiterMiddleware
};

