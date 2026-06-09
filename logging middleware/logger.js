const axios = require('axios');

const LOGGING_API_URL = 'http://4.224.186.213/evaluation-service/logs';
const BEARER_TOKEN = process.env.LOGGING_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmF0aWsuMjNiMDEwMTE5N0BhYmVzLmFjLmluIiwiZXhwIjoxNzgwOTg4MDEzLCJpYXQiOjE3ODA5ODcxMTMsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJhMTJmMWIwZS03Mjc4LTQ4NWItOGU1OC01ZTlhZGJhN2FkMjkiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJwcmF0aWsgc2luZ2giLCJzdWIiOiI2NzM1OGRjZS1hNDI4LTQwOGEtOGM3Ni02NDliMWI1NzIzOWIifSwiZW1haWwiOiJwcmF0aWsuMjNiMDEwMTE5N0BhYmVzLmFjLmluIiwibmFtZSI6InByYXRpayBzaW5naCIsInJvbGxObyI6IjIzMDAzMjAxMDAxOTAiLCJhY2Nlc3NDb2RlIjoiY1h1cWh0IiwiY2xpZW50SUQiOiI2NzM1OGRjZS1hNDI4LTQwOGEtOGM3Ni02NDliMWI1NzIzOWIiLCJjbGllbnRTZWNyZXQiOiJodnVlQ21kSE1FZHJTSGhtIn0.fiyzE2rG63F-2kg8_Qb0ZAdEWYfwcHHhd_Md0L1RKuY';

const STACKS = ['backend', 'frontend'];
const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const COMMON_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

function validateStack(stack) {
  if (!STACKS.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}. Allowed values: ${STACKS.join(', ')}.`);
  }
}

function validateLevel(level) {
  if (!LEVELS.includes(level)) {
    throw new Error(`Invalid level: ${level}. Allowed values: ${LEVELS.join(', ')}.`);
  }
}

function validatePackage(stack, packageName) {
  const allowedPackages = [
    ...COMMON_PACKAGES,
    ...(stack === 'backend' ? BACKEND_PACKAGES : []),
    ...(stack === 'frontend' ? FRONTEND_PACKAGES : []),
  ];

  if (!allowedPackages.includes(packageName)) {
    throw new Error(
      `Invalid package: ${packageName}. Allowed values for ${stack} stack: ${allowedPackages.join(', ')}.`
    );
  }
}

async function log(stack, level, packageName, message) {
  validateStack(stack);
  validateLevel(level);
  validatePackage(stack, packageName);

  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Invalid message: message must be a non-empty string.');
  }

  if (!BEARER_TOKEN) {
    throw new Error('Missing Bearer token. ');
  }

  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  const headers = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(LOGGING_API_URL, payload, { headers });
    return response.data;
  } catch (error) {
    const apiError = error.response ? error.response.data : error.message;
    throw new Error(`Failed to send log: ${apiError}`);
  }
}


function loggingMiddleware(req, res, next) {
  req.log = log;
  next();
}

module.exports = {
  log,
  loggingMiddleware,
};
