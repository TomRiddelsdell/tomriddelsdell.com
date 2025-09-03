// AWS Lambda CommonJS entry point
const { handler, app } = require('./aws-lambda-adapter.js');

// Export for Lambda
exports.handler = handler;
exports.app = app;
