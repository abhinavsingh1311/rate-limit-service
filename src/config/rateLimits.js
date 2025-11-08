/**
 * Rate limit tiers configuration
 * RPM: Requests per minute
 * burst: Maximum number of requests allowed in a burst
 */

const TIERS = {
    FREE: 'free',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise'
};

const RATE_LIMITS = {
    [TIERS.FREE]: {
        rpm: 60,
        burst: 10,
        description: 'Free tier with basic rate limits'
    },
    [TIERS.PREMIUM]: {
        rpm: 600,
        burst: 30,
        description: 'Premium tier with increased rate limits'
    },
    [TIERS.ENTERPRISE]: {
        rpm: 6000,
        burst: 100,
        description: 'Enterprise tier with highest rate limits'
    }
};

const getRateLimitsByTier = (tier) => {
    if (!RATE_LIMITS[tier]) {
        throw new Error(`Invalid tier: ${tier}`);
    }
    return RATE_LIMITS[tier];
};


module.exports = {
    TIERS,
    RATE_LIMITS,
    getRateLimitsByTier
};