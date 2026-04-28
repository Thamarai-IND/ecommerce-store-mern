import express, { Express, Response, Request, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";

import { config } from "./config/env.js";
import {
  connectAllDatabases,
  getUserServiceDB,
  getProductServiceDB,
  getOrderServiceDB,
} from "./config/database.js";
import { initRedis } from "./utils/cache.js";

import { createUserRoutes } from "./services/user-service/user.routes.js";
import { createProductRoutes } from "./services/product-service/product.routes.js";
import { createOrderRoutes } from "./services/order-service/order.routes.js";

import { UserSchema } from "./services/user-service/user.model.js";
import { ProductSchema } from "./services/product-service/product.model.js";
import { OrderSchema } from "./services/order-service/order.model.js";

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(helmet()); // security middleware for express that helps to protect your backend by setting various HTTP header's.
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("combined"));

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
  });

  // Routes will be initialized after database connections
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "OK", message: "API is running" });
  });

  return app;
};

export const setupRoutes = (app: Express): void => {
  try {
    const userServiceDb = getUserServiceDB();
    const productServiceDb = getProductServiceDB();
    const orderServiceDb = getOrderServiceDB();

    if (!userServiceDb || !productServiceDb || !orderServiceDb) {
      throw new Error("Database connections not initialized");
    }

    // Create models
      // @ts-ignore - Known issue with Mongoose 8 types
    const User = userServiceDb.model("User", UserSchema);
    const Product = productServiceDb.model("Product", ProductSchema);
    const Order = orderServiceDb.model("Order", OrderSchema);

    // Setup routes
      // @ts-ignore - Model type compatibility
    app.use("/api/users", createUserRoutes(User));
      // @ts-ignore - Model type compatibility
    app.use("/api/products", createProductRoutes(Product));
      // @ts-ignore - Model type compatibility
    app.use("/api/orders", createOrderRoutes(Order, Product, User));

    console.log("✓ Routes configured");
  } catch (error) {
    console.error("✗ Error setting up routes:", error);
    throw error;
  }
};

export const initializeApplication = async (): Promise<Express> => {
  try {
    // Connect to all databases
    await connectAllDatabases();

    // Initialize Redis cache
    await initRedis();

    // Create Express app
    const app = createApp();

    // Setup routes
    setupRoutes(app);

    console.log("✓ Application initialized successfully");
    return app;
  } catch (error) {
    console.error("✗ Error initializing application:", error);
    throw error;
  }
};

// Global error handler
export const setupErrorHandling = (app: Express): void => {
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Uncaught Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });
};
