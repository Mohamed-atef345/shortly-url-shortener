import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import config from "../config";
import { AuthProvider, User, UserRole } from "../models";

/**
 * Authentication Routes
 * Handles user registration, login, and profile
 */
export const authRoutes = new Elysia({ prefix: "/api/auth" })
	.use(
		jwt({
			name: "jwt",
			secret: config.jwtSecret,
		}),
	)

	// POST /api/auth/register - Register new user
	.post(
		"/register",
		async ({ body, jwt, set }) => {
			const { name, email, password } = body;

			// Check if user already exists
			const existingUser = await User.findOne({ email: email.toLowerCase() });
			if (existingUser) {
				set.status = 400;
				return {
					success: false,
					error: "Email already registered",
				};
			}

			// Create new user
			const user = await User.create({
				name,
				email: email.toLowerCase(),
				password,
				authProvider: AuthProvider.LOCAL,
				role: UserRole.USER,
			});

			// Generate JWT token
			const token = await jwt.sign({
				sub: user._id.toString(),
				email: user.email,
				role: user.role,
			});

			return {
				success: true,
				data: {
					user: {
						id: user._id,
						name: user.name,
						email: user.email,
						role: user.role,
					},
					token,
				},
			};
		},
		{
			body: t.Object({
				name: t.String({ minLength: 2, maxLength: 50 }),
				email: t.String({ format: "email" }),
				password: t.String({
					minLength: 8,
					maxLength: 128,
					pattern:
						"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\\':\\\"\\\\|,.<>\\/?]).{8,}$",
					error:
						"Password must be at least 8 characters and include: uppercase letter, lowercase letter, number, and special character",
				}),
			}),
			detail: {
				tags: ["Auth"],
				summary: "Register a new user",
				description:
					"Creates a new user account with name, email and password. Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
			},
		},
	)

	// POST /api/auth/login - Login user
	.post(
		"/login",
		async ({ body, jwt, set }) => {
			const { email, password } = body;

			// Find user by email
			const user = await User.findOne({
				email: email.toLowerCase(),
				authProvider: AuthProvider.LOCAL,
			});

			if (!user) {
				set.status = 401;
				return {
					success: false,
					error: "Invalid credentials",
				};
			}

			if (user.isSuspended) {
				set.status = 403;
				return {
					success: false,
					error: "Account is suspended. Please contact support.",
				};
			}

			// Verify password
			const isValid = await user.comparePassword(password);
			if (!isValid) {
				set.status = 401;
				return {
					success: false,
					error: "Invalid credentials",
				};
			}

			// Generate JWT token
			const token = await jwt.sign({
				sub: user._id.toString(),
				email: user.email,
				role: user.role,
			});

			return {
				success: true,
				data: {
					user: {
						id: user._id,
						name: user.name,
						email: user.email,
						role: user.role,
					},
					token,
				},
			};
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String(),
			}),
			detail: {
				tags: ["Auth"],
				summary: "Login user",
				description: "Authenticates user and returns JWT token",
			},
		},
	)

	// GET /api/auth/me - Get current user
	.get(
		"/me",
		async ({ headers, jwt, set }) => {
			const authHeader = headers.authorization;

			if (!authHeader?.startsWith("Bearer ")) {
				set.status = 401;
				return {
					success: false,
					error: "Unauthorized: No token provided",
				};
			}

			const token = authHeader.substring(7);
			const payload = await jwt.verify(token);

			if (!payload) {
				set.status = 401;
				return {
					success: false,
					error: "Unauthorized: Invalid token",
				};
			}

			const user = await User.findById(payload.sub).select("-password");

			if (!user) {
				set.status = 404;
				return {
					success: false,
					error: "User not found",
				};
			}

			return {
				success: true,
				data: {
					user: {
						id: user._id,
						name: user.name,
						email: user.email,
						role: user.role,
						createdAt: user.createdAt,
					},
				},
			};
		},
		{
			detail: {
				tags: ["Auth"],
				summary: "Get current user",
				description: "Returns the authenticated user's profile",
			},
		},
	)

	// DELETE /api/auth/delete-account - Delete user account
	.delete(
		"/delete-account",
		async ({ headers, jwt, set }) => {
			const authHeader = headers.authorization;

			if (!authHeader?.startsWith("Bearer ")) {
				set.status = 401;
				return {
					success: false,
					error: "Unauthorized: No token provided",
				};
			}

			const token = authHeader.substring(7);
			const payload = await jwt.verify(token);

			if (!payload) {
				set.status = 401;
				return {
					success: false,
					error: "Unauthorized: Invalid token",
				};
			}

			const user = await User.findById(payload.sub);

			if (!user) {
				set.status = 404;
				return {
					success: false,
					error: "User not found",
				};
			}

			// Import Url model for deleting user's URLs
			const { Url } = await import("../models");

			// Delete all URLs belonging to this user
			await Url.deleteMany({ userId: user._id });

			// Delete the user
			await User.findByIdAndDelete(user._id);

			return {
				success: true,
				message: "Account deleted successfully",
			};
		},
		{
			detail: {
				tags: ["Auth"],
				summary: "Delete account",
				description:
					"Permanently deletes the user account and all associated data",
			},
		},
	);
