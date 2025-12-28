if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandle');

const app = express();

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", require('./routers'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Antam Gold Monitor API Server',
    version: '1.0.0'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
