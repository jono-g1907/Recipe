// wrapper around Mongoose's connection logic so the rest of the app can
// connect to MongoDB without duplicating config
const mongoose = require('mongoose');

let isConnecting = false;
let connectPromise = null;

function connectToDatabase() {
  // reuse the same promise whenever a connection is already being established
  if (connectPromise) {
    return connectPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub_31477046';

  if (!uri) {
    return Promise.reject(new Error('Missing MONGODB_URI environment variable'));
  }

  // prevent multiple concurrent calls from spamming Mongoose with new
  // connection attempts while one is already in progress
  if (isConnecting) {
    return connectPromise;
  }

  isConnecting = true;
  connectPromise = mongoose.connect(uri, {
    autoIndex: true
  }).then(() => {
    // only log once the connection is ready 
    console.log('Connected to MongoDB');
    isConnecting = false;
    return mongoose.connection;
  }).catch((err) => {
    isConnecting = false;
    // surface the error in the logs
    console.error('MongoDB connection failed', err);
    throw err;
  });

  return connectPromise;
}

module.exports = {
  connectToDatabase
};