import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import config from "../config";
import { type IUser, User } from "../models";

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to context
 * Uses resolve pattern for proper error handling
 */
export const authMiddleware = new Elysia({ name: "auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: config.jwtSecret,
    }),
  )
  .resolve(async ({ jwt, bearer, set }) => {
    // Check for bearer token
    if (!bearer) {
      set.status = 401;
      return {
        user: null as unknown as IUser,
        authError: "Unauthorized: No token provided",
      };
    }

    // Verify JWT token
    const payload = await jwt.verify(bearer);
    if (!payload) {
      set.status = 401;
      return {
        user: null as unknown as IUser,
        authError: "Unauthorized: Invalid token",
      };
    }

    // Get user from database
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      set.status = 401;
      return {
        user: null as unknown as IUser,
        authError: "Unauthorized: User not found",
      };
    }

    return {
      user: user as IUser,
      authError: null,
    };
  })
  .onBeforeHandle(({ user, authError, set }) => {
    // If there's an auth error, return it before the handler runs
    if (authError || !user) {
      set.status = 401;
      return {
        success: false,
        error: authError || "Unauthorized",
      };
    }
  });

/**
 * Create JWT token for a user
 */
export const createToken = async (
  jwtSign: (payload: Record<string, unknown>) => Promise<string>,
  user: IUser,
): Promise<string> => {
  return jwtSign({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });
};
