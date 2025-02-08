require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(
  cors({
    origin: 'https://terra-balance.vercel.app/', // Allow requests from all origins (for development, change this in production)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

setupDB();
require('./config/passport')(app);
app.use(routes);

app.use((err, req, res, next) => {
  console.error(chalk.red('Server Error: '), err); // Log the error stack
  res.status(500).json({
    error: 'Internal Server Error. Please try again later.',
  });
});

const server = app.listen(port || 3001, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});

socket(server);
