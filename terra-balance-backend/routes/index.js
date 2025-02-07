const express = require('express');
const router = express.Router();

// Assuming 'apiURL' is set to 'v1' in keys.js
const { apiURL } = require('../config/keys').app;
const apiPrefix = `/api`; // This will be '/v1' if apiURL = 'v1'

// Import all API routes
const apiRoutes = require('./api'); // Make sure you are correctly exporting your routes in api.js

// Register API routes under the prefix
router.use(apiPrefix, apiRoutes);  // this should register routes under '/v1'

// Catch-all for undefined API routes
router.use(apiPrefix, (req, res) => res.status(404).json('No API route found'));

// Export router
module.exports = router;
