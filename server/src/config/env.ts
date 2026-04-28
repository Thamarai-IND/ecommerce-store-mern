import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Database URLs with optional pooling parameters for Atlas
  databases: {
    userService: {
      url: process.env.MONGO_USER_SERVICE_URL || "mongodb://localhost:27017/ecommerce_users",
      localUrl: "mongodb://localhost:27017/ecommerce_users",
      options: {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 45000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      },
    },
    productService: {
      url: process.env.MONGO_PRODUCT_SERVICE_URL || "mongodb://localhost:27017/ecommerce_products",
      localUrl: "mongodb://localhost:27017/ecommerce_products",
      options: {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 45000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      },
    },
    orderService: {
      url: process.env.MONGO_ORDER_SERVICE_URL || "mongodb://localhost:27017/ecommerce_orders",
      localUrl: "mongodb://localhost:27017/ecommerce_orders",
      options: {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 45000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      },
    },
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production",
    expiresIn: process.env.JWT_EXPIRE || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your_super_secret_refresh_key_change_this",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  },
  
  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN
    ? [
        ...process.env.CORS_ORIGIN
          .split(",")
          .map((origin) => origin.trim().replace(/\/$/, "")),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ecommerce-store-mern-six.vercel.app/"
      ]
    : ["http://localhost:3000", "http://127.0.0.1:3000", "https://ecommerce-store-mern-six.vercel.app/"],

  // Local dev fallback when Atlas connectivity is blocked
  dbFallbackToLocal:
    process.env.DB_FALLBACK_TO_LOCAL
      ? process.env.DB_FALLBACK_TO_LOCAL === "true"
      : (process.env.NODE_ENV || "development") === "development",
  
  // Cache TTL
  cacheTTL: {
    default: parseInt(process.env.CACHE_TTL || "3600"),
    database: parseInt(process.env.DATABASE_CACHE_TTL || "300"),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },
};
