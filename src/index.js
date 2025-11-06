const { config } = require('./config/index');
const { createServer } = require('./server');

const app = createServer();

app.listen(config.port);

console.log(`Server is starting at port ${config.port}`);
