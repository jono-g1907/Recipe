const path = require('path');

const ENV = process.env.NODE_ENV || 'development';
const supported = new Set(['development', 'test']);
const target = supported.has(ENV) ? ENV : 'development';
const file = path.join(__dirname, `${target}.js`);
const config = require(file);

module.exports = config;
