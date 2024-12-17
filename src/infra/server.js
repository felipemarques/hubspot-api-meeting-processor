const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const moment = require('moment');
const pullDataFromHubspot = require('../workers/hubspotWorker');

const { PORT, NODE_ENV } = process.env;

const app = express();
const server = http.Server(app);

app.locals.moment = moment;
app.locals.version = process.env.VERSION;
app.locals.NODE_ENV = NODE_ENV;

app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
    version: app.locals.version,
    environment: app.locals.NODE_ENV,
  });
});

app.get('/api/run-worker', async (req, res) => {
  try {
    console.log('🚀 Worker execution started via API');

    await pullDataFromHubspot();

    res.status(200).json({ success: true, message: 'Worker executed successfully!' });
  } catch (error) {
    console.error('❌ Error running the worker:', error.message);
    res.status(500).json({ success: false, message: 'Error executing the worker', error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} in ${NODE_ENV} mode.`);
});
