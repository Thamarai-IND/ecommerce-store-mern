import { Schema } from "mongoose";
import { IOrder, ICartItem } from "../../types/index.js";

const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  userReview: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

export const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: [CartItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying by user
OrderSchema.index({ userId: 1, createdAt: -1 });
