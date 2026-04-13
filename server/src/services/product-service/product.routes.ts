import { Router, Response } from "express";
import { Model, Document } from "mongoose";
import { ProductController } from "./product.controller.js";
import { IProduct, AuthRequest } from "../../types/index.js";
import { authenticate, adminOnly } from "../../middleware/auth.js";

export const createProductRoutes = (productModel: Model<IProduct & Document>): Router => {
  const router = Router();
  const controller = new ProductController(productModel);

  // Create product (admin only)
  router.post("/", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const product = await controller.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Get all products
  router.get("/", async (req: AuthRequest, res: Response) => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await controller.getProducts(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get categories
  router.get("/categories/list", async (_req: AuthRequest, res: Response) => {
    try {
      const categories = await controller.getCategories();
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Search products
  router.get("/search", async (req: AuthRequest, res: Response) => {
    try {
      const query = req.query.q as string;
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query) {
        res.status(400).json({ message: "Search query is required" });
        return;
      }

      const result = await controller.searchProducts(query, skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Filter products
  router.get("/filter", async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        search: req.query.search as string,
      };

      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await controller.getProductsByFilter(filters, skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get products by category
  router.get("/category/:category", async (req: AuthRequest, res: Response) => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await controller.getProductsByCategory(
        req.params.category,
        skip,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get product by ID
  router.get("/:productId", async (req: AuthRequest, res: Response) => {
    try {
      const product = await controller.getProductById(req.params.productId);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Update product (admin only)
  router.put("/:productId", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const product = await controller.updateProduct(req.params.productId, req.body);
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Delete product (admin only)
  router.delete("/:productId", authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
      const result = await controller.deleteProduct(req.params.productId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  return router;
};
