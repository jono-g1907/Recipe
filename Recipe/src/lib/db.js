const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let isConnecting = false;
let connectPromise = null;

function connectToDatabase() {
  if (connectPromise) {
    return connectPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_hub_31477046';

  if (!uri) {
    return Promise.reject(new Error('Missing MONGODB_URI environment variable'));
  }

  if (isConnecting) {
    return connectPromise;
  }

  isConnecting = true;
  connectPromise = mongoose.connect(uri, {
    autoIndex: true
  }).then(() => {
    console.log('Connected to MongoDB');
    isConnecting = false;
    return mongoose.connection;
  }).catch((err) => {
    isConnecting = false;
    console.error('MongoDB connection failed', err);
    throw err;
  });

  return connectPromise;
}

module.exports = {
  connectToDatabase
};

