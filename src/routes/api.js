const express = require('express');
const { config } = require('../config/index');
const { rateLimiterMiddleware } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', rateLimiterMiddleware, (req, res) => {
    res.json({
        message: 'API root endpoint',
    });
});

router.get('/data', rateLimiterMiddleware, (req, res) => {
    const tenant = req.tenant;
    res.json({
        message: 'Success',
        tier: tenant.tier,
        data: {
            sample: 'This is protected data',
            timestamp: new Date().toISOString()
        }
    });
});

module.exports = router;