const createApp = require('./server/createApp');
const store = require('./store');

const app = createApp({ store: store });

store.seedDatabase()
  .then(function () {
    app.listen(app.get('port'), function () {
      console.log('Server running at http://localhost:' + app.get('port') + '/');
      console.log('API base: http://localhost:' + app.get('port') + '/api');
    });
  })
  .catch(function (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  });

module.exports = app;
