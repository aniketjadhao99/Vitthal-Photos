const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('ERROR: MONGO_URI or DATABASE_URL is not set in environment.');
  process.exit(2);
}

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 10000 });
    console.log('OK: Connected to MongoDB successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('FAILED to connect to MongoDB');
    console.error('Error message:', err.message);
    if (err.name === 'MongoParseError') {
      console.error('- It looks like the connection string format is invalid (SRV vs standard).');
    }
    if (err.message && err.message.includes('Authentication failed')) {
      console.error('- Authentication failed: check username/password in the URI.');
    }
    if (err.message && err.message.includes('ENOTFOUND')) {
      console.error('- Host not found: check your DNS or host in the URI.');
    }
    if (err.message && err.message.includes('ECONNREFUSED')) {
      console.error('- Connection refused: ensure the MongoDB server is running and reachable.');
    }
    process.exit(1);
  }
})();
