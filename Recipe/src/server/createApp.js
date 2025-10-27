const fs = require('fs');
const path = require('path');
const express = require('express');
const constants = require('../lib/constants');
const apiRouter = require('../routes');
const notFound = require('../middleware/notFound');
const errorHandler = require('../middleware/error');
const registerPageRoutes = require('./routes');

function createApp(dependencies) {
  const store = dependencies && dependencies.store ? dependencies.store : require('../store');
  const appId = constants.APP_ID;
  const app = express();

  app.set('port', 8080);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = ['http://localhost:8080', 'http://localhost:4200'];

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    } else {
      res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    res.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Requested-With, x-user-id'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(
    '/bootstrap',
    express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/css/bootstrap.min.css'))
  );

  app.get('/bootstrap.bundle.min.js', function (req, res) {
    res.sendFile(path.join(__dirname, '../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'));
  });

  app.set('views', path.join(__dirname, '../views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

  app.use(express.static(path.join(__dirname, '../images')));
  app.use(express.static(path.join(__dirname, '../css')));
  app.use(express.static(path.join(__dirname, '../views'), { index: false }));

  const angularDistPath = path.join(
    __dirname,
    '../../assignment3-angular/dist/assignment3-angular/browser'
  );

  const hasAngularBuild = fs.existsSync(angularDistPath);

  if (hasAngularBuild) {
    app.use('/app', express.static(angularDistPath));

    app.get(['/app', '/app/'], (req, res) => {
      res.sendFile(path.join(angularDistPath, 'index.html'));
    });
  }

  app.use('/api', apiRouter);

  if (hasAngularBuild) {
    app.use(express.static(angularDistPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      res.sendFile(path.join(angularDistPath, 'index.html'));
    });
  } else {
    registerPageRoutes(app, { store: store, appId: appId });
  }
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
