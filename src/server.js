const express = require('express');
const cors = require('cors');
const { config } = require('./config/index');
const { requestLogger } = require('./middleware/requestLogger');
const { default: helmet } = require('helmet');

const createServer = () => {

    const server = express();

    server
        .use(helmet())
        .use(express.urlencoded({ extended: true }))
        .use(express.json())
        .use(cors())
        .use(requestLogger)

    server.get('/health', (req, res) => {
        res.json({ ok: true, environment: config.env });
    })

    server.get('/', (req, res) => {
        res.send('<p>Hello!</p>');
    })

    return server;
}

module.exports = {
    createServer
}