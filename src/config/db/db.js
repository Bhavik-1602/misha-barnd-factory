// Import mongoose library to interact with MongoDB
import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using the URI defined in environment variables.
 * Uses async/await for asynchronous connection handling.
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using URI and recommended options
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,      // Use the new MongoDB connection string parser
      useUnifiedTopology: true,   // Use the new server discovery and monitoring engine
    });

    // Log a success message when connected
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    // Log an error message if connection fails
    console.error('MongoDB Connection Failed:', error.message);

    // Exit the process with failure
    process.exit(1);
  }
};

// Export the function to use it in other parts of the application
export default connectDB;
