const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_CONNECTION_STRING;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_CONNECTION_STRING is not defined"
      );
    }

    const isMongoURI =
      mongoURI.startsWith("mongodb://") ||
      mongoURI.startsWith("mongodb+srv://");

    if (!isMongoURI) {
      throw new Error(
        "Invalid MongoDB connection string. It must start with mongodb:// or mongodb+srv://"
      );
    }

    // Never print the real password
    const safeURI = mongoURI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      "mongodb$1://$2:****@"
    );

    console.log("=================================");
    console.log("🔄 Connecting to MongoDB...");
    console.log(`🔗 ${safeURI}`);
    console.log("=================================");

    const conn = await mongoose.connect(
      mongoURI,
      {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      }
    );

    console.log("=================================");
    console.log("✅ MongoDB Connected");
    console.log(
      `📦 Database: ${conn.connection.name}`
    );
    console.log(
      `🖥️ Host: ${conn.connection.host}`
    );
    console.log("=================================");

    return conn;
  } catch (error) {
    console.error("=================================");
    console.error("❌ MongoDB Connection Error");
    console.error(`📛 ${error.message}`);
    console.error("=================================");

    throw error;
  }
};

module.exports = connectDB;