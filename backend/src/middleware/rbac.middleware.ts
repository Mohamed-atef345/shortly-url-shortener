import { Elysia } from "elysia";
import { type IUser, UserRole } from "../models";

/**
 * Role-Based Access Control (RBAC) Middleware
 * Creates a middleware that checks if user has required roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
	return new Elysia({ name: `rbac-${allowedRoles.join("-")}` }).derive(
		({ user, set }: { user?: IUser; set: any }) => {
			if (!user) {
				set.status = 401;
				throw new Error("Unauthorized: Authentication required");
			}

			if (!allowedRoles.includes(user.role)) {
				set.status = 403;
				throw new Error("Forbidden: Insufficient permissions");
			}

			return { user };
		},
	);
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Require user role (includes both user and admin)
 */
export const requireUser = requireRole(UserRole.USER, UserRole.ADMIN);
