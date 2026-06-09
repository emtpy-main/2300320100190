const axios = require('axios');

const LOGGING_API_URL = 'http://4.224.186.213/evaluation-service/logs';
const BEARER_TOKEN = process.env.LOGGING_API_TOKEN;

let cachedToken = null;

async function getAuthToken() {
  if (cachedToken) return cachedToken;
  try {
    const response = await axios.post('http://4.224.186.213/evaluation-service/auth', {
      email: "pratik.23b0101197@abes.ac.in",
      name: "pratik singh",
      rollNo: "2300320100190",
      accessCode: "cXuqht",
      clientID: "67358dce-a428-408a-8c76-649b1b57239b",
      clientSecret: "hvueCmdHMEdrSHhm"
    });
    
    let token = null;
    if (response.data) {
      if (typeof response.data === "string") {
        token = response.data;
      } else {
        token = response.data.token || response.data.access_token;
      }
    }
    if (!token) {
      throw new Error("No token received in auth response");
    }
    cachedToken = token;
    return cachedToken;
  } catch (error) {
    console.error("Logger authentication failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

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

  const token = BEARER_TOKEN || await getAuthToken();

  if (!token) {
    throw new Error('Missing Bearer token. ');
  }

  let sanitizedMessage = message;
  if (sanitizedMessage.length > 48) {
    sanitizedMessage = sanitizedMessage.slice(0, 45) + "...";
  }

  const payload = {
    stack,
    level,
    package: packageName,
    message: sanitizedMessage,
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(LOGGING_API_URL, payload, { headers });
    return response.data;
  } catch (error) {
    const apiError = error.response ? JSON.stringify(error.response.data) : error.message;
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
