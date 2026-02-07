import mongoose from "mongoose";

export const connectDatabase = async () => {
	try {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			throw new Error("MONGODB_URI environment variable is not defined");
		}

		await mongoose.connect(uri);
		console.log("✅ MongoDB connected successfully");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
		process.exit(1);
	}
};

export const disconnectDatabase = async () => {
	try {
		await mongoose.disconnect();
		console.log("✅ MongoDB disconnected");
	} catch (error) {
		console.error("❌ MongoDB disconnect error:", error);
	}
};
