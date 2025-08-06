const serverless = require('vercel-serverless-express');
const app = require('../server/server');

module.exports = serverless(app);