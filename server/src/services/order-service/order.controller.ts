import { Model, Document } from "mongoose";
import { IOrder, ICartItem } from "../../types/index.js";
import { setCache, getCache, deleteCache } from "../../utils/cache.js";

export class OrderController {
  constructor(private orderModel: Model<IOrder & Document>) {}

  async createOrder(userId: string, items: ICartItem[], totalAmount: number, paymentMethod: string) {
    const order = new this.orderModel({
      userId,
      items,
      totalAmount,
      paymentMethod,
    });

    await order.save();

    // Invalidate cache
    await deleteCache(`user:orders:${userId}`);
    await deleteCache(`dashboard:stats:${userId}`);

    return order.toJSON();
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
          totalRevenue: { $sum: "$items.price" },
        },
      },
    ];

    stats = await this.orderModel.aggregate(pipeline);

    // Cache the stats with longer TTL
    await setCache(cacheKey, stats, 1800);
    return stats;
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
