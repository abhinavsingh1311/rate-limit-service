const express = require('express');
const { config } = require('../config/index');
const { isRedisConnected } = require('../config/redis');

const router = express.Router();

router.get('/', (req, res) => { res.json({ status: "ok", timestamp: Date.now(), environment: config.env }) });
router.get('/ready', (req, res) => { const redisConnected = isRedisConnected(); res.status(redisConnected ? 200 : 503).json({ status: redisConnected ? "ready" : "not ready", redis: redisConnected ? "connected" : "disconnected" }) });
router.get('/live', (req, res) => { res.json({ status: "alive", uptime: process.uptime() }) });

module.exports = router;
