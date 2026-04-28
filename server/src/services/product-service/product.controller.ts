import { Model, Document } from "mongoose";
import { IProduct } from "../../types/index.js";
import { setCache, getCache, deleteCache, deleteCachePattern } from "../../utils/cache.js";

export class ProductController {
  constructor(private productModel: Model<IProduct & Document>) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private buildTokenSearchQuery(searchText: string) {
    const terms = searchText
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => this.escapeRegex(term));

    if (terms.length === 0) {
      return {};
    }

    // Require every typed word to appear in either name or description.
    return {
      $and: terms.map((term) => ({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
        ],
      })),
    };
  }

  private normalizeProductInput<T extends Partial<IProduct>>(data: T): T {
    const normalized = { ...data };
    if (typeof normalized.image === "string") {
      const trimmed = normalized.image.trim();
      normalized.image = (trimmed || undefined) as T["image"];
    }
    return normalized;
  }

  async createProduct(data: IProduct) {
    const normalizedData = this.normalizeProductInput(data);
    const product = new this.productModel(normalizedData);
    await product.save();

    // Invalidate cache
    await deleteCachePattern("products:*");
    await deleteCache(`category:${normalizedData.category}`);

    return product.toJSON();
  }

  async getProducts(skip: number = 0, limit: number = 10) {
    const cacheKey = `products:list:${skip}:${limit}`;
    
    // Try to get from cache
    let products = await getCache(cacheKey);
    if (products) {
      return products;
    }

    const [data, total] = await Promise.all([
      this.productModel.find().skip(skip).limit(limit),
      this.productModel.countDocuments(),
    ]);

    const result = {
      data: data.map(p => p.toJSON()),
      total,
      skip,
      limit,
    };

    // Cache the results
    await setCache(cacheKey, result, 300);
    return result;
  }

  async getProductById(productId: string) {
    const cacheKey = `product:${productId}`;
    
    // Try to get from cache
    let product = await getCache(cacheKey);
    if (product) {
      return product;
    }

    product = await this.productModel.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Cache the product
    await setCache(cacheKey, product.toJSON(), 600);
    return product.toJSON();
  }

  async getProductsByCategory(category: string, skip: number = 0, limit: number = 10) {
    const cacheKey = `category:${category}:${skip}:${limit}`;
    
    // Try to get from cache
    let result = await getCache(cacheKey);
    if (result) {
      return result;
    }

    const [data, total] = await Promise.all([
      this.productModel.find({ category }).skip(skip).limit(limit),
      this.productModel.countDocuments({ category }),
    ]);

    result = {
      data: data.map(p => p.toJSON()),
      total,
      skip,
      limit,
      category,
    };

    // Cache the results
    await setCache(cacheKey, result, 300);
    return result;
  }

  async searchProducts(query: string, skip: number = 0, limit: number = 10) {
    const cacheKey = `search:v2:${query}:${skip}:${limit}`;
    const searchQuery = this.buildTokenSearchQuery(query);
    
    // Try to get from cache
    let result = await getCache(cacheKey);
    if (result) {
      return result;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(searchQuery)
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(searchQuery),
    ]);

    result = {
      data: data.map(p => p.toJSON()),
      total,
      skip,
      limit,
      query,
    };

    // Cache the results with shorter TTL for searches
    await setCache(cacheKey, result, 180);
    return result;
  }

  async updateProduct(productId: string, data: Partial<IProduct>) {
    const normalizedData = this.normalizeProductInput(data);
    const product = await this.productModel.findByIdAndUpdate(
      productId,
      { $set: normalizedData },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    // Invalidate cache
    await deleteCache(`product:${productId}`);
    await deleteCachePattern("products:*");
    if (normalizedData.category) {
      await deleteCachePattern(`category:${normalizedData.category}*`);
    }

    return product.toJSON();
  }

  async deleteProduct(productId: string) {
    const product = await this.productModel.findByIdAndDelete(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Invalidate cache
    await deleteCache(`product:${productId}`);
    await deleteCachePattern("products:*");
    await deleteCachePattern(`category:${product.category}*`);

    return { message: "Product deleted successfully" };
  }

  async getCategories() {
    const cacheKey = "categories:all";
    
    // Try to get from cache
    let categories = await getCache(cacheKey);
    if (categories) {
      return categories;
    }

    categories = await this.productModel.distinct("category");
    
    // Cache the results
    await setCache(cacheKey, categories, 1800);
    return categories;
  }

  async getProductsByFilter(filters: { category?: string; minPrice?: number; maxPrice?: number; search?: string }, skip: number = 0, limit: number = 10) {
    const query: any = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.search) {
      Object.assign(query, this.buildTokenSearchQuery(filters.search));
    }

    const cacheKey = `filter:v2:${JSON.stringify(filters)}:${skip}:${limit}`;
    
    // Try to get from cache
    let result = await getCache(cacheKey);
    if (result) {
      return result;
    }

    const [data, total] = await Promise.all([
      this.productModel.find(query).skip(skip).limit(limit),
      this.productModel.countDocuments(query),
    ]);

    result = {
      data: data.map(p => p.toJSON()),
      total,
      skip,
      limit,
    };

    // Cache the results
    await setCache(cacheKey, result, 300);
    return result;
  }

  async getCategoryWiseRatingStats() {
    const cacheKey = "stats:category:ratings";

    // Try to get from cache
    let stats = await getCache(cacheKey);
    if (stats) {
      return stats;
    }

    stats = await this.productModel.aggregate([
      {
        $group: {
          _id: "$category",
          avgRating: { $avg: "$rating" },
          productsCount: { $sum: 1 },
          totalReviews: { $sum: "$reviews" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          productsCount: 1,
          totalReviews: 1,
        },
      },
      {
        $sort: { avgRating: -1 },
      },
    ]);

    await setCache(cacheKey, stats, 600);
    return stats;
  }

  async getProductWiseRatingStats() {
    const cacheKey = "stats:product:ratings";

    // Try to get from cache
    let stats = await getCache(cacheKey);
    if (stats) {
      return stats;
    }

    stats = await this.productModel.aggregate([
      {
        $match: { rating: { $gt: 0 } },
      },
      {
        $project: {
          _id: 1,
          productName: "$name",
          avgRating: "$rating",
          totalReviews: "$reviews",
          category: "$category",
        },
      },
      {
        $sort: { avgRating: -1 },
      },
    ]);

    await setCache(cacheKey, stats, 600);
    return stats;
  }
}
