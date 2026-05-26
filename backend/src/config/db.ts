import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/veda-assessment";
  
  console.log(`Connecting to MongoDB at: ${uri}...`);
  
  try {
    // Set a short timeout so it fails quickly if MongoDB is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isConnected = true;
    console.log("🟢 Successfully connected to MongoDB.");
  } catch (error: any) {
    isConnected = false;
    console.warn("⚠️ Failed to connect to MongoDB. Error:", error.message);
    console.warn("🟡 Falling back to Local In-Memory Database Mode. Assessment data will not persist after server restarts.");
  }
}

export function isDbConnected() {
  return isConnected;
}
