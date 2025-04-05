const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Options to handle deprecation warnings and ensure proper connection
    const options = {
      // No need to set these options in newer mongoose versions
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Retry connection after delay in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 