import { Router, Response } from "express";
import { Model, Document } from "mongoose";
import { OrderController } from "./order.controller.js";
import { IOrder, AuthRequest } from "../../types/index.js";
import { authenticate, adminOnly } from "../../middleware/auth.js";

export const createOrderRoutes = (orderModel: Model<IOrder & Document>): Router => {
  const router = Router();
  const controller = new OrderController(orderModel);

  // Create order
  router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { items, totalAmount, paymentMethod } = req.body;

      if (!items || !totalAmount || !paymentMethod) {
        res.status(400).json({ message: "items, totalAmount, and paymentMethod are required" });
        return;
      }

      const order = await controller.createOrder(
        req.user!.userId,
        items,
        totalAmount,
        paymentMethod
      );

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Get user orders
  router.get("/user/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.userId !== req.params.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await controller.getUserOrders(req.params.userId, skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all orders (admin only)
  router.get("/", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await controller.getAllOrders(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get order by ID
  router.get("/:orderId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const order = await controller.getOrderById(req.params.orderId);

      if (req.user?.userId !== order.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Update order status (admin only)
  router.put("/:orderId", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }

      const order = await controller.updateOrderStatus(req.params.orderId, status);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Get dashboard stats
  router.get("/dashboard/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.userId !== req.params.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      const stats = await controller.getDashboardStats(req.params.userId);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get category wise sales stats (admin only)
  router.get("/stats/category-sales", authenticate, adminOnly, async (_req: AuthRequest, res: Response) => {
    try {
      const stats = await controller.getCategoryWiseSalesStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  return router;
};
