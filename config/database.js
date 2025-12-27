const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bristol_utilities';
    const conn = await mongoose.connect(primaryUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    const fallbackUri = 'mongodb://localhost:27017/bristol_utilities';
    const isSrvIssue = (error && typeof error.message === 'string') && (error.message.includes('querySrv') || error.message.includes('_mongodb._tcp') || error.message.includes('ENOTFOUND'));
    const hasSrv = process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb+srv');

    console.error(`Error: ${error.message}`.red.underline.bold);

    if (isSrvIssue && hasSrv) {
      console.log('SRV lookup failed. Attempting local MongoDB fallback...'.yellow.bold);
      try {
        const conn = await mongoose.connect(fallbackUri);
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`.cyan.underline);
        return;
      } catch (fallbackError) {
        console.error(`Fallback connection error: ${fallbackError.message}`.red.underline.bold);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;
