import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { User, UserRole } from "../models/User";

const promoteToAdmin = async () => {
	const email = process.argv[2];

	if (!email) {
		console.error("Please provide an email address");
		console.error("Usage: bun src/scripts/create-admin.ts <email>");
		process.exit(1);
	}

	try {
		await connectDatabase();

		const user = await User.findOne({ email });

		if (!user) {
			console.error(`User with email ${email} not found`);
			process.exit(1);
		}

		if (user.role === UserRole.ADMIN) {
			console.log(`User ${email} is already an admin`);
			process.exit(0);
		}

		user.role = UserRole.ADMIN;
		await user.save();

		console.log(`Successfully promoted ${email} to admin`);
	} catch (error) {
		console.error("Error promoting user:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
};

promoteToAdmin();
