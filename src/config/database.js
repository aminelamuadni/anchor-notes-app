/**
 * Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment.
 * It provides a straight-forward, schema-based solution to model your application data.
 *
 * @see {@link https://mongoosejs.com/|Mongoose Documentation}
 */

const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database.
 * @async
 * @function connectDB
 * @returns {Promise<void>} A Promise that resolves when the connection is successful.
 * @throws {Error} If there is an error connecting to the database.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
