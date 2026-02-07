import { Url } from "../models/Url";
import { User } from "../models/User";

export const AdminController = {
	getSystemStats: async () => {
		try {
			const [userCount, urlCount, totalClicksResult] = await Promise.all([
				User.countDocuments(),
				Url.countDocuments(),
				Url.aggregate([
					{ $group: { _id: null, total: { $sum: "$clickCount" } } },
				]),
			]);

			const totalClicks =
				totalClicksResult.length > 0 ? totalClicksResult[0].total : 0;

			// Get recent users (last 5)
			const recentUsers = await User.find()
				.sort({ createdAt: -1 })
				.limit(5)
				.select("-password");

			return {
				success: true,
				data: {
					users: userCount,
					urls: urlCount,
					clicks: totalClicks,
					recentUsers,
				},
			};
		} catch (error) {
			console.error("Error fetching system stats:", error);
			throw error;
		}
	},

	getAllUsers: async () => {
		try {
			const users = await User.find()
				.sort({ createdAt: -1 })
				.select("-password");
			return { success: true, data: users };
		} catch (error) {
			console.error("Error fetching users:", error);
			throw error;
		}
	},

	toggleSuspension: async (userId: string) => {
		try {
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			const newStatus = !user.isSuspended;

			// Use findByIdAndUpdate to bypass pre-save hooks that might be causing issues
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ isSuspended: newStatus },
				{ new: true },
			);

			return {
				success: true,
				message: `User ${updatedUser?.isSuspended ? "suspended" : "unsuspended"} successfully`,
				data: { isSuspended: updatedUser?.isSuspended },
			};
		} catch (error) {
			console.error("Error toggling suspension:", error);
			throw error;
		}
	},

	deleteUser: async (userId: string) => {
		try {
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			// Delete user's URLs
			await Url.deleteMany({ userId: user._id });

			// Delete user
			await User.findByIdAndDelete(userId);

			return { success: true, message: "User deleted successfully" };
		} catch (error) {
			console.error("Error deleting user:", error);
			throw error;
		}
	},
};
