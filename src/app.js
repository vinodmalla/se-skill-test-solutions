const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); //bug 2 -install the morgan package 
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');

const app = express();

app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json()); //bug 3 -parse json is redundant since express 4.16+, but it's not causing any issues, so we can leave it in for now. It just means that the app can parse JSON request bodies, which is necessary for our API endpoints to work correctly.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', authRoutes)
app.use('/', taskRoutes);
app.use('/health', healthRoutes);

app.use((err, req, res, next) => {
  console.log('Something went wrong:', err.message);
  res.status(500).json({ error: err.message }); //bug 9 --stack: err.stack exposes sensitive info, so we should remove it from the error response to avoid potential security risks.
});

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log('TaskFlow server running on port ' + PORT);
});

module.exports = app;
