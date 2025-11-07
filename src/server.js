const express = require('express');
const cors = require('cors');
const { config } = require('./config/index');
const { requestLogger } = require('./middleware/requestLogger');
const helmet = require('helmet');
const healthRoutes = require('./routes/health');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandling');

const createServer = () => {

    const server = express();

    server
        .use(helmet())
        .use(express.urlencoded({ extended: true }))
        .use(express.json())
        .use(cors())
        .use(requestLogger)


    server.use('/health', healthRoutes);

    server.get('/', (req, res) => {
        res.send('<p>Hello!</p>');
    })

        //Error handling
        .use(notFoundHandler)
        .use(globalErrorHandler)
    return server;
}

module.exports = {
    createServer
}