import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_MONGO_URLS = {
  userService: "mongodb://localhost:27017/ecommerce_users",
  productService: "mongodb://localhost:27017/ecommerce_products",
  orderService: "mongodb://localhost:27017/ecommerce_orders",
};

const CLOUD_MONGO_URLS = {
  userService: process.env.MONGO_USER_SERVICE_URL || "mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_users",
  productService: process.env.MONGO_PRODUCT_SERVICE_URL || "mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_products",
  orderService: process.env.MONGO_ORDER_SERVICE_URL || "mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_orders",
};

const CONNECTION_OPTIONS = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 45000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
};

interface MigrationStats {
  service: string;
  collections: Record<string, { source: number; migrated: number; success: boolean }>;
  startTime: number;
  endTime: number;
}

const stats: MigrationStats[] = [];

// Helper function to extract database name from MongoDB connection URL
function extractDatabaseName(url: string): string {
  const match = url.match(/\/([^/?]+)(?:\?|$)/);
  return match ? match[1] : 'default';
}

async function migrateService(
  serviceName: string,
  localUrl: string,
  cloudUrl: string
): Promise<MigrationStats> {
  console.log(`\n📦 Starting migration for ${serviceName}...`);
  const startTime = Date.now();

  let localConn: mongoose.Connection | null = null;
  let cloudConn: mongoose.Connection | null = null;

  try {
    // Connect to local MongoDB
    console.log(`🔗 Connecting to local MongoDB (${serviceName})...`);
    localConn = await mongoose.createConnection(localUrl).asPromise();
    console.log(`✓ Connected to local ${serviceName}`);

    // Connect to cloud MongoDB
    console.log(`☁️  Connecting to cloud MongoDB (${serviceName})...`);
    cloudConn = await mongoose.createConnection(cloudUrl, CONNECTION_OPTIONS).asPromise();
    console.log(`✓ Connected to cloud ${serviceName}`);

    // Get all collections from local database
    const localDbName = extractDatabaseName(localUrl);
    const localDb = localConn.getClient().db(localDbName);
    const collections = await localDb.listCollections().toArray();

    console.log(`📊 Found ${collections.length} collection(s) in ${serviceName}`);

    const serviceStats: MigrationStats = {
      service: serviceName,
      collections: {},
      startTime,
      endTime: 0,
    };

    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n  📋 Migrating collection: ${collectionName}...`);

      try {
        // Get data from local collection
        const localCollection = localDb.collection(collectionName);
        const documents = await localCollection.find({}).toArray();
        console.log(`    ✓ Found ${documents.length} documents in local collection`);

        // Get cloud database and collection
        const cloudDbName = extractDatabaseName(cloudUrl);
        const cloudDb = cloudConn.getClient().db(cloudDbName);
        const cloudCollection = cloudDb.collection(collectionName);

        // Check if collection exists in cloud and has data
        const cloudDocCount = await cloudCollection.countDocuments();
        if (cloudDocCount > 0) {
          console.log(
            `    ⚠️  Cloud collection already has ${cloudDocCount} documents. Skipping to avoid duplicates.`
          );
          serviceStats.collections[collectionName] = {
            source: documents.length,
            migrated: cloudDocCount,
            success: false,
          };
          continue;
        }

        // Insert documents to cloud collection
        if (documents.length > 0) {
          const result = await cloudCollection.insertMany(documents);
          console.log(`    ✓ Successfully migrated ${result.insertedCount} documents`);
          serviceStats.collections[collectionName] = {
            source: documents.length,
            migrated: result.insertedCount,
            success: result.insertedCount === documents.length,
          };
        } else {
          console.log(`    ℹ️  No documents to migrate (collection is empty)`);
          serviceStats.collections[collectionName] = {
            source: 0,
            migrated: 0,
            success: true,
          };
        }
      } catch (error) {
        console.error(`    ✗ Error migrating collection ${collectionName}:`, error);
        serviceStats.collections[collectionName] = {
          source: 0,
          migrated: 0,
          success: false,
        };
      }
    }

    serviceStats.endTime = Date.now();
    return serviceStats;
  } catch (error) {
    console.error(`✗ Error during ${serviceName} migration:`, error);
    throw error;
  } finally {
    // Close connections
    if (localConn) {
      await localConn.close();
      console.log(`\n✓ Closed local ${serviceName} connection`);
    }
    if (cloudConn) {
      await cloudConn.close();
      console.log(`✓ Closed cloud ${serviceName} connection`);
    }
  }
}

async function runMigration(): Promise<void> {
  console.log("========================================");
  console.log("  MongoDB Migration: Local → Atlas Cloud");
  console.log("========================================");
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Migrate all services sequentially
    for (const service of Object.keys(LOCAL_MONGO_URLS) as Array<keyof typeof LOCAL_MONGO_URLS>) {
      const serviceStats = await migrateService(
        service,
        LOCAL_MONGO_URLS[service],
        CLOUD_MONGO_URLS[service]
      );
      stats.push(serviceStats);
    }

    // Print summary
    console.log("\n========================================");
    console.log("  📊 Migration Summary");
    console.log("========================================");

    for (const serviceStat of stats) {
      console.log(`\n${serviceStat.service}:`);
      let totalSource = 0;
      let totalMigrated = 0;
      let totalSuccess = true;

      for (const [collName, collStat] of Object.entries(serviceStat.collections)) {
        totalSource += collStat.source;
        totalMigrated += collStat.migrated;
        if (!collStat.success) totalSuccess = false;

        const status = collStat.success ? "✓" : "✗";
        console.log(
          `  ${status} ${collName}: ${collStat.migrated}/${collStat.source} migrated`
        );
      }

      const duration = (serviceStat.endTime - serviceStat.startTime) / 1000;
      console.log(`  ⏱️  Duration: ${duration.toFixed(2)}s`);
      console.log(
        `  Status: ${totalSuccess ? "✓ Success" : "⚠️  Partially completed"}`
      );
    }

    console.log("\n✓ Migration completed at:", new Date().toISOString());
    console.log("========================================\n");
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
runMigration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
