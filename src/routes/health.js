const express = require('express');
const { config } = require('../config/index');

const router = express.Router();

router.get('/', (req, res) => { res.json({ status: "ok", timestamp: Date.now(), environment: config.env }) });
router.get('/ready', (req, res) => { res.json({ status: "ready", redis: "not_connected" }) });
router.get('/live', (req, res) => { res.json({ status: "ready", uptime: process.uptime() }) });

module.exports = router;
