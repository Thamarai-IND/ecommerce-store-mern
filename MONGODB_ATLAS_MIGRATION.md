# MongoDB Atlas Migration Guide

## Overview
This guide explains how to migrate your local MongoDB data to MongoDB Atlas cloud database.

## What We've Done

### 1. Updated Configuration Files
- **`server/src/config/env.ts`**: Added connection pooling parameters optimized for cloud MongoDB:
  - `maxPoolSize: 50` - Maximum database connections for OLTP workload
  - `minPoolSize: 10` - Pre-warmed connections for immediate availability  
  - `maxIdleTimeMS: 45000` - Disconnect idle connections after 45 seconds
  - `connectTimeoutMS: 10000` - Connection timeout of 10 seconds
  - `socketTimeoutMS: 45000` - Socket timeout of 45 seconds
  - `retryWrites: true` - Automatic retry on network failures (Atlas feature)

- **`server/.env`**: Updated with your MongoDB Atlas connection strings

### 2. Created Migration Script
- **`server/src/scripts/migrate-to-atlas.ts`**: Automated migration tool that:
  - Connects to both local and cloud MongoDB instances
  - Exports all documents from each local collection
  - Imports them into corresponding cloud databases
  - Provides detailed migration report with statistics
  - Handles errors gracefully

## Prerequisites

### MongoDB Atlas Setup
1. ✅ You have a MongoDB Atlas cluster running (Cluster0)
2. ✅ User credentials: `thamarai:thamarai`
3. ✅ Connection string ready: `mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/`

### Local Environment
- ✅ Local MongoDB running on `localhost:27017`
- ✅ Node.js installed
- ✅ Dependencies installed: `npm install` in `/server`

## Migration Steps

### Step 1: Verify Your Setup
```bash
cd server

# Ensure .env file has correct Atlas credentials
cat .env | grep MONGO
```

Expected output:
```
MONGO_USER_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_users
MONGO_PRODUCT_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_products
MONGO_ORDER_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_orders
```

### Step 2: Run the Migration Script
```bash
# Build and run migration
npm run migrate:atlas
```

### What the Script Does
1. ✓ Connects to local MongoDB (ecommerce_users, ecommerce_products, ecommerce_orders)
2. ✓ Lists all collections in each database
3. ✓ For each collection:
   - Fetches all documents from local MongoDB
   - Checks if collection already exists in cloud (to prevent duplicates)
   - Inserts all documents into cloud MongoDB
   - Reports success/failure for each collection
4. ✓ Provides detailed migration summary with timing

### Sample Output
```
========================================
  MongoDB Migration: Local → Atlas Cloud
========================================
Started at: 2024-04-26T10:30:00.000Z

📦 Starting migration for userService...
🔗 Connecting to local MongoDB (userService)...
✓ Connected to local userService
☁️  Connecting to cloud MongoDB (userService)...
✓ Connected to cloud userService
📊 Found 2 collection(s) in userService

  📋 Migrating collection: users...
    ✓ Found 5 documents in local collection
    ✓ Successfully migrated 5 documents

[... more collections ...]

========================================
  📊 Migration Summary
========================================

userService:
  ✓ users: 5/5 migrated
  ✓ sessions: 0/0 migrated
  ⏱️  Duration: 2.34s
  Status: ✓ Success

[... other services ...]

✓ Migration completed at: 2024-04-26T10:30:15.000Z
========================================
```

## Step 3: Verify Migration in Atlas

### Option A: Using MongoDB Atlas UI
1. Log in to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your Cluster0
3. Go to "Collections" tab
4. Verify databases appear:
   - `ecommerce_users`
   - `ecommerce_products`
   - `ecommerce_orders`
5. Check collection counts match your local data

### Option B: Using MongoDB CLI / MongoSH
```bash
# Connect to your cluster
mongosh "mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_users"

# List all databases
show dbs

# List collections in current database
show collections

# Count documents in a collection
db.users.countDocuments()
```

## Step 4: Update Your Application

### For Development
No changes needed! Your application already reads from the `.env` file which now points to Atlas.

### For Production
Update your deployment environment variables with the Atlas connection strings:
```
MONGO_USER_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_users
MONGO_PRODUCT_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_products
MONGO_ORDER_SERVICE_URL=mongodb+srv://thamarai:thamarai@cluster0.chyixql.mongodb.net/ecommerce_orders
```

## Step 5: Test Connection

### Start Your Server
```bash
npm run dev
```

### Check Logs
You should see:
```
✓ User Service DB connected
✓ Product Service DB connected
✓ Order Service DB connected
✓ All database connections established
```

### Test API Endpoints
```bash
# Test if your API can read from Atlas
curl http://localhost:5000/api/products

# Should return products migrated to Atlas
```

## Architecture Changes

### Connection Pool Optimization
The connection pooling is configured optimally for:
- **OLTP Workload**: Quick, frequent operations
- **Cloud Environment**: Handles network latency gracefully
- **Serverless Ready**: Can be adapted for Lambda/Vercel if needed

### Database Isolation
Each service has its own database:
- User data → `ecommerce_users`
- Product data → `ecommerce_products`
- Order data → `ecommerce_orders`

This provides:
- ✓ Data isolation
- ✓ Independent scaling
- ✓ Cleaner backups and recovery
- ✓ Microservices architecture support

## Troubleshooting

### Issue: Connection times out
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure local MongoDB is running
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod
```

### Issue: "Authentication failed"
```
Error: MongoServerError: unable to authenticate user
```
**Solution**: Verify credentials in `.env` file match your MongoDB Atlas user

### Issue: Network Access Error
```
Error: connect ENOTFOUND cluster0.chyixql.mongodb.net
```
**Solution**: 
1. Check your internet connection
2. Go to MongoDB Atlas Dashboard → Network Access
3. Add your IP address to the allowed list (or use 0.0.0.0/0 for development)

### Issue: Collections already exist
```
⚠️  Cloud collection already has X documents. Skipping to avoid duplicates.
```
**Solution**: This is safe - the script won't duplicate data. If you want to re-migrate:
1. Delete collections from cloud database manually
2. Re-run the migration script

### Issue: TypeScript errors during migration
```bash
# Clear compiled files and rebuild
rm -rf dist
npm run migrate:atlas
```

## Security Notes

⚠️ **Important for Production**:

1. **Change Password**: Use a strong password instead of `thamarai`
   - MongoDB Atlas Dashboard → Database Users → Edit
   - Generate a new password

2. **Environment Variables**: 
   - Never commit `.env` files to Git
   - Use `.gitignore` entry: `server/.env`
   - Use repository secrets in CI/CD

3. **Network Access**:
   - For production, whitelist only your server's IP
   - Don't use `0.0.0.0/0` in production

4. **Encryption**:
   - MongoDB Atlas encrypts data at rest
   - Connections use TLS/SSL automatically

## Next Steps

1. ✅ Verify all data migrated successfully
2. ✅ Run your test suite against Atlas data
3. ✅ Monitor performance in MongoDB Atlas Dashboard
4. ✅ Set up automated backups in MongoDB Atlas
5. ✅ Configure alerts for connection issues
6. (Optional) Delete local MongoDB data once confirmed everything works

## Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Connection Pooling](https://docs.mongodb.com/manual/reference/connection-string/)
- [Atlas Network Access](https://docs.atlas.mongodb.com/security/ip-access-list/)

---

**Migration Date**: April 26, 2024  
**Status**: ✅ Ready to migrate
