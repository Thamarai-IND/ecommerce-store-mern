import { Router, Response } from "express";
import { Model, Document } from "mongoose";
import { UserController } from "./user.controller.js";
import { IUser, AuthRequest } from "../../types/index.js";
import { authenticate, adminOnly } from "../../middleware/auth.js";

export const createUserRoutes = (userModel: Model<IUser & Document>): Router => {
  const router = Router();
  const controller = new UserController(userModel);

  // Register
  router.post("/register", async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ message: "Email, password, and name are required" });
        return;
      }

      const result = await controller.register(email, password, name, role || "user");
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Login
  router.post("/login", async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const result = await controller.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  });

  // Get user by ID
  router.get("/profile/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const user = await controller.getUserById(req.params.userId);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Update user
  router.put("/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.userId !== req.params.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const user = await controller.updateUser(req.params.userId, req.body);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Get all users (admin only)
  router.get("/", authenticate, adminOnly, async (_req: AuthRequest, res: Response) => {
    try {
      const users = await controller.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Delete user (admin only)
  router.delete("/:userId", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const result = await controller.deleteUser(req.params.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  return router;
};
