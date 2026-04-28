import mongoose from "mongoose";
import { config } from "./env.js";

// Service database connections
let userServiceDb: mongoose.Connection | null = null;
let productServiceDb: mongoose.Connection | null = null;
let orderServiceDb: mongoose.Connection | null = null;

const isLocalMongoUrl = (url: string): boolean =>
  url.startsWith("mongodb://localhost") || url.startsWith("mongodb://127.0.0.1");

const connectWithFallback = async (
  serviceName: string,
  primaryUrl: string,
  localUrl: string,
  options: mongoose.ConnectOptions
): Promise<mongoose.Connection> => {
  try {
    return await mongoose.createConnection(primaryUrl, options).asPromise();
  } catch (error) {
    const shouldFallback =
      config.dbFallbackToLocal && !isLocalMongoUrl(primaryUrl) && primaryUrl !== localUrl;

    if (!shouldFallback) {
      throw error;
    }

    console.warn(
      `⚠ ${serviceName}: primary DB connection failed. Retrying with local MongoDB (${localUrl})`
    );
    return mongoose.createConnection(localUrl, options).asPromise();
  }
};

export const connectUserServiceDB = async (): Promise<void> => {
  try {
    userServiceDb = await connectWithFallback(
      "User Service DB",
      config.databases.userService.url,
      config.databases.userService.localUrl,
      config.databases.userService.options
    );
    console.log("✓ User Service DB connected");
  } catch (error) {
    console.error("✗ User Service DB connection failed:", error);
    throw error;
  }
};

export const connectProductServiceDB = async (): Promise<void> => {
  try {
    productServiceDb = await connectWithFallback(
      "Product Service DB",
      config.databases.productService.url,
      config.databases.productService.localUrl,
      config.databases.productService.options
    );
    console.log("✓ Product Service DB connected");
  } catch (error) {
    console.error("✗ Product Service DB connection failed:", error);
    throw error;
  }
};

export const connectOrderServiceDB = async (): Promise<void> => {
  try {
    orderServiceDb = await connectWithFallback(
      "Order Service DB",
      config.databases.orderService.url,
      config.databases.orderService.localUrl,
      config.databases.orderService.options
    );
    console.log("✓ Order Service DB connected");
  } catch (error) {
    console.error("✗ Order Service DB connection failed:", error);
    throw error;
  }
};

export const connectAllDatabases = async (): Promise<void> => {
  try {
    await Promise.all([
      connectUserServiceDB(),
      connectProductServiceDB(),
      connectOrderServiceDB(),
    ]);
    console.log("✓ All database connections established");
  } catch (error) {
    console.error("✗ Failed to connect to one or more databases:", error);
    throw error;
  }
};

export const getUserServiceDB = () => userServiceDb;
export const getProductServiceDB = () => productServiceDb;
export const getOrderServiceDB = () => orderServiceDb;

export const disconnectAllDatabases = async (): Promise<void> => {
  try {
    if (userServiceDb) await userServiceDb.close();
    if (productServiceDb) await productServiceDb.close();
    if (orderServiceDb) await orderServiceDb.close();
    console.log("✓ All database connections closed");
  } catch (error) {
    console.error("✗ Error disconnecting databases:", error);
    throw error;
  }
};
