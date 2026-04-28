import { Model, Document } from "mongoose";
import { IOrder, ICartItem, IProduct, IUser } from "../../types/index.js";
import { setCache, getCache, deleteCache, deleteCachePattern } from "../../utils/cache.js";

interface ProductReviewItem {
  userId: string;
  userName: string;
  rating?: number;
  review?: string;
  createdAt?: Date;
}

export class OrderController {
  constructor(
    private orderModel: Model<IOrder & Document>,
    private productModel: Model<IProduct & Document>,
    private userModel: Model<IUser & Document>
  ) {}

  private async syncOrderFeedbackToProducts(userId: string, items: ICartItem[]) {
    const updates = items
      .filter((item) => item.productId)
      .map(async (item) => {
        const trimmedReview = item.userReview?.trim();
        const hasRating = typeof item.userRating === "number";
        const hasReview = Boolean(trimmedReview);

        if (!hasRating && !hasReview) {
          return;
        }

        const product = await this.productModel.findById(item.productId);
        if (!product) {
          return;
        }

        const currentReviews = product.reviews || 0;
        const currentRating = product.rating || 0;

        let nextReviews = currentReviews;
        let nextRating = currentRating;

        if (hasRating) {
          nextReviews = currentReviews + 1;
          nextRating = ((currentRating * currentReviews) + (item.userRating as number)) / nextReviews;
        }

        const existingReviewData = Array.isArray(product.reviewsData) ? product.reviewsData : [];
        const nextReviewData = [
          ...existingReviewData,
          {
            userId,
            rating: hasRating ? item.userRating : undefined,
            review: hasReview ? trimmedReview : undefined,
            createdAt: new Date(),
          },
        ];

        await this.productModel.findByIdAndUpdate(item.productId, {
          $set: {
            rating: Number(nextRating.toFixed(2)),
            reviews: nextReviews,
            reviewsData: nextReviewData,
          },
        });
      });

    await Promise.all(updates);
  }

  private buildStockReservationMap(items: ICartItem[]) {
    const quantityByProduct = new Map<string, number>();

    for (const item of items) {
      const productId = String(item.productId || "").trim();
      const quantity = Number(item.quantity || 0);

      if (!productId) {
        throw new Error("Invalid product in order items");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product ${productId}`);
      }

      quantityByProduct.set(productId, (quantityByProduct.get(productId) || 0) + quantity);
    }

    return quantityByProduct;
  }

  private async rollbackReservedStock(reservedStock: Array<{ productId: string; quantity: number }>) {
    if (reservedStock.length === 0) return;

    await Promise.all(
      reservedStock.map((entry) =>
        this.productModel.findByIdAndUpdate(entry.productId, {
          $inc: { stock: entry.quantity },
        })
      )
    );
  }

  private async reserveStockForOrder(items: ICartItem[]) {
    const quantityByProduct = this.buildStockReservationMap(items);
    const reservedStock: Array<{ productId: string; quantity: number }> = [];

    for (const [productId, quantity] of quantityByProduct.entries()) {
      const updatedProduct = await this.productModel.findOneAndUpdate(
        {
          _id: productId,
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        await this.rollbackReservedStock(reservedStock);
        const currentProduct = await this.productModel.findById(productId).select("name stock").lean();
        const productName = currentProduct?.name || "product";
        const available = currentProduct?.stock ?? 0;
        throw new Error(`Insufficient stock for ${productName}. Available stock: ${available}`);
      }

      reservedStock.push({ productId, quantity });
    }

    return reservedStock;
  }

  async createOrder(userId: string, items: ICartItem[], totalAmount: number, paymentMethod: string) {
    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    const reservedStock = await this.reserveStockForOrder(items);

    try {
      const order = new this.orderModel({
        userId,
        items,
        totalAmount,
        paymentMethod,
      });

      await order.save();

      // Order should succeed even if feedback sync fails.
      try {
        await this.syncOrderFeedbackToProducts(userId, items);
      } catch (syncError) {
        console.error("Feedback sync failed after order creation:", syncError);
      }

      // Invalidate cache
      await deleteCache(`user:orders:${userId}`);
      await deleteCache(`dashboard:stats:${userId}`);
      await deleteCache("stats:category:sales");
      await deleteCache("stats:category:ratings");
      await deleteCache("stats:product:ratings");
      await deleteCachePattern("products:*");
      await deleteCachePattern("category:*");

      const productFeedbackCacheInvalidations = items.map((item) => item.productId).filter(Boolean);
      await Promise.all(
        productFeedbackCacheInvalidations.flatMap((productId) => [
          deleteCache(`product:${productId}`),
          deleteCache(`product:ratings:summary:${productId}`),
          deleteCache(`product:reviews:list:${productId}`),
        ])
      );

      return order.toJSON();
    } catch (error) {
      await this.rollbackReservedStock(reservedStock);
      throw error;
    }
  }

  async getProductRatingSummaryFromOrders(productId: string) {
    const cacheKey = `product:ratings:summary:${productId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.orderModel.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": productId,
          "items.userRating": { $gte: 1, $lte: 5 },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$items.userRating" },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ["$averageRating", 2] },
          reviewCount: 1,
        },
      },
    ]);

    const summary = result[0] || { averageRating: 0, reviewCount: 0 };
    await setCache(cacheKey, summary, 300);
    return summary;
  }

  async getProductReviewsWithUserNames(productId: string) {
    const cacheKey = `product:reviews:list:${productId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const orderItems = await this.orderModel.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": productId,
          $or: [
            { "items.userRating": { $gte: 1, $lte: 5 } },
            { "items.userReview": { $exists: true, $ne: "" } },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$userId",
          rating: "$items.userRating",
          review: "$items.userReview",
          createdAt: "$createdAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const userIds = [...new Set(orderItems.map((item) => item.userId).filter(Boolean))];
    const users = await this.userModel.find({ _id: { $in: userIds } }, { name: 1 }).lean();
    const userMap = new Map(users.map((u) => [String(u._id), u.name]));

    const reviews: ProductReviewItem[] = orderItems.map((item) => ({
      userId: item.userId,
      userName: userMap.get(String(item.userId)) || "User",
      rating: item.rating,
      review: item.review,
      createdAt: item.createdAt,
    }));

    await setCache(cacheKey, reviews, 300);
    return reviews;
  }

  async getOrderById(orderId: string) {
    const cacheKey = `order:${orderId}`;
    
    // Try to get from cache
    let order = await getCache(cacheKey);
    if (order) {
      return order;
    }

    order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Cache the order
    await setCache(cacheKey, order.toJSON(), 600);
    return order.toJSON();
  }

  async getUserOrders(userId: string, skip: number = 0, limit: number = 10) {
    const cacheKey = `user:orders:${userId}:${skip}:${limit}`;
    
    // Try to get from cache
    let result = await getCache(cacheKey);
    if (result) {
      return result;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments({ userId }),
    ]);

    result = {
      data: data.map(o => o.toJSON()),
      total,
      skip,
      limit,
    };

    // Cache the results
    await setCache(cacheKey, result, 300);
    return result;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new Error("Order not found");
    }

    // Invalidate cache
    await deleteCache(`order:${orderId}`);
    await deleteCache(`user:orders:${order.userId}`);

    return order.toJSON();
  }

  async getDashboardStats(userId: string) {
    const cacheKey = `dashboard:stats:${userId}`;
    
    // Try to get from cache
    let stats = await getCache(cacheKey);
    if (stats) {
      return stats;
    }

    const orders = await this.orderModel.find({ userId });

    let totalProductsBought = 0;
    let totalAmountSpent = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        totalProductsBought += item.quantity;
      });
      totalAmountSpent += order.totalAmount;
    });

    stats = {
      totalProductsBought,
      totalAmountSpent,
      ordersCount: orders.length,
      recentOrders: orders.slice(0, 5).map(o => o.toJSON()),
    };

    // Cache the stats
    await setCache(cacheKey, stats, 600);
    return stats;
  }

  async getCategoryWiseSalesStats() {
    const cacheKey = "stats:category:sales";

    // Try to get from cache
    let stats = await getCache(cacheKey);
    if (stats) {
      return stats;
    }

    const pipeline = [
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ];

    const salesByProduct = await this.orderModel.aggregate(pipeline);

    const productIds = salesByProduct.map((item) => item._id).filter(Boolean);
    const products = await this.productModel
      .find({ _id: { $in: productIds } }, { _id: 1, name: 1, category: 1 })
      .lean();

    const productMap = new Map(
      products.map((product) => [String(product._id), { name: product.name, category: product.category }])
    );

    const productRevenue = salesByProduct.map((item) => {
      const productInfo = productMap.get(String(item._id));
      const totalRevenue = Number(item.totalRevenue || 0);

      return {
        productId: String(item._id),
        productName: productInfo?.name || "Unknown Product",
        category: productInfo?.category || "Uncategorized",
        totalQuantity: item.totalQuantity,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      };
    });

    const categoryAccumulator = new Map<string, { totalQuantity: number; totalRevenue: number }>();
    for (const item of productRevenue) {
      const existing = categoryAccumulator.get(item.category) || { totalQuantity: 0, totalRevenue: 0 };
      existing.totalQuantity += item.totalQuantity;
      existing.totalRevenue += item.totalRevenue;
      categoryAccumulator.set(item.category, existing);
    }

    const categorySales = Array.from(categoryAccumulator.entries())
      .map(([category, value]) => ({
        category,
        totalQuantity: value.totalQuantity,
        totalRevenue: Number(value.totalRevenue.toFixed(2)),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    productRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue);

    stats = {
      categorySales,
      productRevenue,
    };

    // Cache the stats with longer TTL
    await setCache(cacheKey, stats, 1800);
    return stats;
  }

  async syncProductsFromOrdersFeedback() {
    const cacheKey = "sync:products:feedback";

    const recentlySynced = await getCache(cacheKey);
    if (recentlySynced) {
      return { synced: false, message: "Already synced recently" };
    }

    const feedbackRows = await this.orderModel.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": { $exists: true, $ne: "" },
          $or: [
            { "items.userRating": { $gte: 1, $lte: 5 } },
            { "items.userReview": { $exists: true, $ne: "" } },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$items.productId",
          userId: "$userId",
          rating: "$items.userRating",
          review: "$items.userReview",
          createdAt: "$createdAt",
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    const groupedByProduct = new Map<
      string,
      Array<{ userId: string; rating?: number; review?: string; createdAt?: Date }>
    >();

    for (const row of feedbackRows) {
      const productId = String(row.productId);
      const existing = groupedByProduct.get(productId) || [];
      existing.push({
        userId: String(row.userId),
        rating: typeof row.rating === "number" ? row.rating : undefined,
        review: typeof row.review === "string" ? row.review : undefined,
        createdAt: row.createdAt,
      });
      groupedByProduct.set(productId, existing);
    }

    await this.productModel.updateMany({}, {
      $set: {
        rating: 0,
        reviews: 0,
        reviewsData: [],
      },
    });

    const updates = Array.from(groupedByProduct.entries()).map(([productId, entries]) => {
      const ratedEntries = entries.filter((entry) => typeof entry.rating === "number");
      const reviewsCount = ratedEntries.length;
      const avgRating = reviewsCount
        ? ratedEntries.reduce((sum, entry) => sum + (entry.rating as number), 0) / reviewsCount
        : 0;

      return {
        updateOne: {
          filter: { _id: productId },
          update: {
            $set: {
              rating: Number(avgRating.toFixed(2)),
              reviews: reviewsCount,
              reviewsData: entries.map((entry) => ({
                userId: entry.userId,
                rating: entry.rating,
                review: entry.review,
                createdAt: entry.createdAt || new Date(),
              })),
            },
          },
        },
      };
    });

    if (updates.length > 0) {
      await this.productModel.bulkWrite(updates);
    }

    await deleteCachePattern("products:*");
    await deleteCachePattern("category:*");
    await deleteCache("stats:category:ratings");
    await deleteCache("stats:product:ratings");
    await deleteCache("stats:category:sales");

    await setCache(cacheKey, { syncedAt: new Date().toISOString() }, 120);

    return {
      synced: true,
      syncedProducts: groupedByProduct.size,
      totalFeedbackRows: feedbackRows.length,
    };
  }

  async getAllOrders(skip: number = 0, limit: number = 10) {
    const cacheKey = `orders:all:${skip}:${limit}`;
    
    // Try to get from cache
    let result = await getCache(cacheKey);
    if (result) {
      return result;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(),
    ]);

    result = {
      data: data.map(o => o.toJSON()),
      total,
      skip,
      limit,
    };

    // Cache the results
    await setCache(cacheKey, result, 300);
    return result;
  }
}
