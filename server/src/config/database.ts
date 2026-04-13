import mongoose from "mongoose";
import { config } from "./env.js";

// Service database connections
let userServiceDb: mongoose.Connection | null = null;
let productServiceDb: mongoose.Connection | null = null;
let orderServiceDb: mongoose.Connection | null = null;

export const connectUserServiceDB = async (): Promise<void> => {
  try {
    userServiceDb = await mongoose.createConnection(config.databases.userService).asPromise();
    console.log("✓ User Service DB connected");
  } catch (error) {
    console.error("✗ User Service DB connection failed:", error);
    throw error;
  }
};

export const connectProductServiceDB = async (): Promise<void> => {
  try {
    productServiceDb = await mongoose.createConnection(config.databases.productService).asPromise();
    console.log("✓ Product Service DB connected");
  } catch (error) {
    console.error("✗ Product Service DB connection failed:", error);
    throw error;
  }
};

export const connectOrderServiceDB = async (): Promise<void> => {
  try {
    orderServiceDb = await mongoose.createConnection(config.databases.orderService).asPromise();
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
