import express from 'express';
import path from 'path';
import ConfigManager from './utils/configManager';
import passport from 'passport';
import { strategy } from './strategies/jwt.bearer.strategy';
import { handleAdminReact } from './routeHandlers/adminReact';
import useragent from 'express-useragent';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import httpContext from 'express-http-context';
import { generateNonce } from './utils/nonce';
import { constants } from './constants';
import { handleSecurityPolicy } from './routeHandlers/contentSecurityPolicy';
import { generateUUID } from './utils/uuid.util';
import { handleAlert } from './routeHandlers/alert';
import { handleMemoryCheck } from './routeHandlers/memoryChecker';
import { handleVersion } from './routeHandlers/version';
import { handleLogout } from './routeHandlers/logout';
import { getImageVersion } from './utils/getImageVersion';

const app = express();

const httpProtocol = process.env.ENVIRONMENT === 'local' ? 'http' : 'https';

// middleware to parse cookies
app.use(cookieParser());

// middleware to parse user agent string
app.use(useragent.express());

// middleware for oAuth
app.use(passport.initialize());

// helmet protects against common OWASP attacks: https://www.securecoding.com/blog/using-helmetjs/
app.use(helmet());

// Used to initialize context for each request
app.use(httpContext.middleware);

// generate nonce, and add to httpContext
app.use((req, res, next) => {
  const nonce = generateNonce();
  httpContext.set(constants.RESPONSE_NONCE, nonce);
  next();
});

app.use(handleSecurityPolicy);

/**
 * Generate a unique ID for each request at earliest.
 * Use x-request-id in header if sent.
 */
app.use((req, res, next) => {
  // Generates a unique uuid that is used for operations
  const uniqueRequestId = generateUUID();
  httpContext.set(
    constants.REQUEST_ID_TYPE.SYSTEM_GENERATED_REQUEST_ID,
    uniqueRequestId,
  );

  // Stores the userRequestId in httpContext and later used for logging and creating bundles.
  // @ts-ignore
  req.id = req.id || req.header(`${constants.REQUEST_ID_HEADER}`) || uniqueRequestId;
  // @ts-ignore
  httpContext.set(constants.REQUEST_ID_TYPE.USER_REQUEST_ID, req.id);
  next();
});

// log every incoming request
app.use(async (req, res, next) => {
  const reqPath = req.originalUrl;
  const reqMethod = req.method.toUpperCase();
  console.log('Incoming Request', { path: reqPath, method: reqMethod });
  next();
});

app.get('/live', (req, res) => handleMemoryCheck(req, res));

app.get('/ready', (req, res) => handleMemoryCheck(req, res));

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.get('/version', handleVersion);
app.get('/logout', handleLogout);
app.get('/logout_action', (req, res) => {
  const returnUrl = `${httpProtocol}`.concat('://', `${req.headers.host}`, '/logout');
  const configManager = new ConfigManager();
  const logoutUrl = `${configManager.AUTH_CODE_FLOW_URL}/logout?client_id=${configManager.AUTH_CODE_FLOW_CLIENT_ID}&logout_uri=${returnUrl}`;
  res.redirect(logoutUrl);
});

app.get('/alert', handleAlert);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/favicon.ico', express.static(path.join(__dirname, 'images/favicon.ico')));

// save oauth static files
app.use(express.static(path.join(__dirname, 'oauth')));

// serve react js and css files
app.use('/static', express.static(path.join(__dirname, './../build/static')));

app.get('/api/env', (req, res) => {
  // Send only the environment variables you want to expose
  res.json({
    FHIR_SERVER_URL: process.env.FHIR_SERVER_URL,
    AUTH_CUSTOM_GROUP: process.env.AUTH_CUSTOM_GROUP,
    AUTH_CUSTOM_SCOPE: process.env.AUTH_CUSTOM_SCOPE,
  });
});

// handles when the user is redirected by the OpenIDConnect/OAuth provider
app.get('/authcallback', (req, res) => {
  const configManager = new ConfigManager();
  const httpProtocol1 = configManager.ENVIRONMENT === 'local' ? 'http' : 'https';
  console.log(`Request: ${req.query}`);
  console.log(`Code: ${req.query.code}`);
  // @ts-ignore
  const state: string = req.query.state;
  const resourceUrl = state ? encodeURIComponent(Buffer.from(state, 'base64').toString('ascii')) : '';
  const redirectUrl = `${httpProtocol1}`.concat('://', `${req.headers.host}`, '/authcallback');
  let fullRedirectUrl =
    `/callback.html?code=${req.query.code}&resourceUrl=${resourceUrl}` +
    `&clientId=${configManager.AUTH_CODE_FLOW_CLIENT_ID}&redirectUri=${redirectUrl}` +
    `&tokenUrl=${configManager.AUTH_CODE_FLOW_URL}/oauth2/token`;
  console.log(`AuthCallback Redirecting to ${fullRedirectUrl}`);
  res.redirect(fullRedirectUrl);
});

const configManager = new ConfigManager();

if (configManager.authEnabled) {
  // Set up admin routes
  console.log('Setting up passport routes');
  passport.use('adminStrategy', strategy);
  // app.use(cors(fhirServerConfig.server.corsOptions));
}

const adminRouter = express.Router({ mergeParams: true });
if (configManager.authEnabled) {
  adminRouter.use(passport.initialize());
  adminRouter.use(passport.authenticate('adminStrategy', { session: false }, undefined));
}
adminRouter.get('/admin/:op?', (req, res, next) =>
  handleAdminReact(req, res, next),
);
app.use(adminRouter);

app.locals.currentYear = new Date().getFullYear();
app.locals.deployEnvironment = process.env.ENVIRONMENT;
app.locals.deployVersion = getImageVersion();

app.get('/robots.txt', (req, res) => {
  // Your logic for the route goes here
  // If the resource is not found, send a 404 response
  res.status(404).send('Not Found');
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname + './../build/index.html'));
});

// enables access to reverse proxy information
// https://expressjs.com/en/guide/behind-proxies.html
app.enable('trust proxy');

export { app };
