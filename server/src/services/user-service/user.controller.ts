import { Model, Document } from "mongoose";
import { IUser } from "../../types/index.js";
import { generateToken, generateRefreshToken } from "../../utils/jwt.js";
import { setCache, getCache, deleteCache } from "../../utils/cache.js";

export class UserController {
  constructor(private userModel: Model<IUser & Document>) {}

  async register(email: string, password: string, name: string, role: string = "user") {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = new this.userModel({ email, password, name, role });
    await user.save();

    const payload = { userId: user._id as string, email: user.email, role: user.role };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: user.toJSON(),
      token,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

      // @ts-ignore - Mongoose schema method
      const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const payload = { userId: user._id as string, email: user.email, role: user.role };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: user.toJSON(),
      token,
      refreshToken,
    };
  }

  async getUserById(userId: string) {
    const cacheKey = `user:${userId}`;
    
    // Try to get from cache
    let user = await getCache(cacheKey);
    if (user) {
      return user;
    }

    user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Cache the user
    await setCache(cacheKey, user.toJSON(), 3600);
    return user.toJSON();
  }

  async updateUser(userId: string, data: Partial<IUser>) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    // Invalidate cache
    await deleteCache(`user:${userId}`);

    return user.toJSON();
  }

  async getAllUsers() {
    const cacheKey = "users:all";
    
    // Try to get from cache
    let users = await getCache(cacheKey);
    if (users) {
      return users;
    }

    users = await this.userModel.find().select("-password");
    
    // Cache the results
    await setCache(cacheKey, users, 1800);
    return users;
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Invalidate caches
    await deleteCache(`user:${userId}`);
    await deleteCache("users:all");

    return { message: "User deleted successfully" };
  }
}
