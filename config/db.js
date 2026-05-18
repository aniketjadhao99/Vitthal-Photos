const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Recommended options for current mongoose + mongodb driver
    // Base options
    const opts = {
      serverSelectionTimeoutMS: 10000, // keep trying for 10s
      socketTimeoutMS: 45000,
    };

    // Optional: enable relaxed TLS settings for local debugging only.
    // Set MONGO_TLS_ALLOW_INVALID=true in your .env to enable this.
    const tlsDebug = String(process.env.MONGO_TLS_ALLOW_INVALID).toLowerCase() === 'true';
    if (tlsDebug) {
      console.warn('⚠️ Running with MONGO_TLS_ALLOW_INVALID=true — TLS validation is disabled (debug only)');
      opts.tls = true;
      opts.tlsAllowInvalidCertificates = true;
      opts.tlsAllowInvalidHostnames = true;
    }

    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error && error.message ? error.message : error);
    console.error('Detailed error:', error);
    // don't crash the process here - let the server start so we can surface errors in logs
  }
};

module.exports = connectDB;