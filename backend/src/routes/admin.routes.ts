import { Elysia, t } from "elysia";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware, requireAdmin } from "../middleware";

export const adminRoutes = new Elysia({ prefix: "/admin" })
	.use(authMiddleware) // Ensure user is authenticated first
	.use(requireAdmin) // Ensure user is an admin
	.get("/stats", () => AdminController.getSystemStats())
	.get("/users", () => AdminController.getAllUsers())
	.patch(
		"/users/:id/suspend",
		({ params: { id } }) => AdminController.toggleSuspension(id),
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.delete(
		"/users/:id",
		({ params: { id } }) => AdminController.deleteUser(id),
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
