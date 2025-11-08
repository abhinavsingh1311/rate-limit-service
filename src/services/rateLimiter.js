
const { getRateLimitsByTier } = require("../config/rateLimits");
const { client } = require("../config/redis");
const { Logger } = require("../utils/logger");
const { TokenBucket } = require("../utils/tokenBucket");

class rateLimiterService {
    constructor() {
        this.redisKeyProfile = 'rateLimit';
    }

    getBucketKeyById(tenantId) {
        return `${this.redisKeyProfile}:${tenantId}`;
    }

    async initializeBucket(tenantId, tier) {
        const limits = getRateLimitsByTier(tier);
        const bucket = {
            capacity: limits.burst.toString(),
            tokens: limits.burst.toString(),
            lastRefill: Date.now().toString(),
            refillRate: (limits.rpm / 60 / 1000).toString()
        }
        await client.hSet(this.getBucketKeyById(tenantId), {
            ...bucket
        });
        await client.expire(this.getBucketKeyById(tenantId), 3600);
        return bucket;
    }

    async getBucket(tenantId, tier) {
        const bucketKey = this.getBucketKeyById(tenantId);
        let bucket = await client.hGetAll(bucketKey);

        if (!bucket || Object.keys(bucket).length === 0) {
            bucket = await this.initializeBucket(tenantId, tier);
        }

        return {
            ...bucket,
            tokens: parseFloat(bucket.tokens),
            lastRefill: parseInt(bucket.lastRefill),
            capacity: parseFloat(bucket.capacity),
            refillRate: parseFloat(bucket.refillRate)
        };
    }

    async checkRateLimit(tenantId, tier) {
        const bucket = await this.getBucket(tenantId, tier);
        Logger.info(`[${tenantId}] Before check - Tokens: ${bucket.tokens}, lastRefill: ${bucket.lastRefill} `)
        const tokenBucket = new TokenBucket(
            bucket.capacity,
            bucket.refillRate * 60 * 1000,
        );

        tokenBucket.tokens = bucket.tokens;
        tokenBucket.lastRefill = bucket.lastRefill;

        const allowed = tokenBucket.allowRequest();
        Logger.info(`[${tenantId}] After allowRequest - Tokens: ${tokenBucket.tokens}, Allowed: ${allowed}`);

        const tokensNeeded = 1;
        const tokenShortfall = Math.max(0, tokensNeeded - tokenBucket.tokens);
        const timeToNextTokenMs = bucket.refillRate > 0 ? tokenShortfall / bucket.refillRate : 0;

        if (allowed) {
            Logger.info(`[${tenantId}] Saving to Redis - Tokens: ${tokenBucket.tokens}, LastRefill: ${tokenBucket.lastRefill}`);

            await client.hSet(this.getBucketKeyById(tenantId), {
                tokens: tokenBucket.tokens.toString(),
                lastRefill: tokenBucket.lastRefill.toString()
            });

            const verify = await client.hGetAll(this.getBucketKeyById(tenantId));
            Logger.info(`[${tenantId}] Verified Redis - Tokens: ${verify.tokens}`);

        }

        const response = {
            allowed,
            remaining: Math.floor(tokenBucket.tokens),
            limit: bucket.capacity,
            resetTime: Date.now() + Math.ceil(timeToNextTokenMs),
            retryAfter: Math.ceil(timeToNextTokenMs / 1000)
        }

        if (!allowed) {
            response.error = 'Rate Limit Exceeded';
            response.statusCode = 429;
        }

        return response
    }

}

module.exports = new rateLimiterService();