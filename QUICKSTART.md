# E-Commerce Admin Panel - Quick Start Guide

## Project Overview

This is a complete full-stack e-commerce admin panel application with:
- **Frontend**: React 19 with Redux Toolkit, TypeScript, Tailwind CSS
- **Backend**: Express.js with Microservices Architecture
- **Database**: MongoDB (3 separate instances)
- **Caching**: Redis (Backend) + LocalStorage (Frontend)
- **Authentication**: JWT-based

## Prerequisites

1. **Node.js** (v18+)
2. **npm or yarn**
3. **MongoDB** (running on `localhost:27017`)
4. **Redis** (optional, running on `localhost:6379`)

## Installation Steps

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# The .env file is already configured
# Make sure MongoDB is running on localhost:27017

# Start the development server
npm run dev
```

**Expected Output:**
```
✓ User Service DB connected
✓ Product Service DB connected
✓ Order Service DB connected
✓ Redis connected
✓ All database connections established
✓ Routes configured
✓ Application initialized successfully
✓ Server running on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 123 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

## Accessing the Application

### Frontend
- **URL**: http://localhost:3000
- **Default Routes**:
  - `/` - Home page
  - `/login` - Login page
  - `/register` - Registration page
  - `/products` - Product listing, search & filter
  - `/cart` - Shopping cart
  - `/dashboard` - User dashboard
  - `/admin` - Admin product management (admin only)

### Backend API
- **Base URL**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Test Credentials

### User Account
```
Email: user@example.com
Password: password123
```

### Admin Account
```
Email: admin@example.com
Password: password123
```

**To create these test accounts:**
1. Go to http://localhost:3000/register
2. Register with the credentials above
3. First registered user will be a regular user
4. To make an account an admin, manually update MongoDB:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## API Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Test Get Products
```bash
curl http://localhost:5000/api/products?skip=0&limit=10
```

### Test Create Product (Admin Only)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1200,
    "category": "Electronics",
    "stock": 50
  }'
```

## Project Structure

### Backend
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts      # MongoDB connections
│   │   └── env.ts           # Configuration
│   ├── middleware/
│   │   └── auth.ts          # JWT & role-based auth
│   ├── services/
│   │   ├── user-service/    # User CRUD & auth
│   │   ├── product-service/ # Product CRUD & search
│   │   └── order-service/   # Orders & stats
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── utils/
│   │   ├── cache.ts         # Redis caching
│   │   └── jwt.ts           # JWT utilities
│   ├── app.ts               # Express setup
│   └── server.ts            # Entry point
├── package.json
├── tsconfig.json
└── .env
```

### Frontend
```
client/
├── src/
│   ├── components/
│   │   └── Header.tsx       # Navigation header
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── AdminPanelPage.tsx
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── productSlice.ts
│   │   │   ├── cartSlice.ts
│   │   │   └── orderSlice.ts
│   │   └── index.ts
│   ├── services/
│   │   └── api.ts           # Axios API client
│   ├── hooks/
│   │   └── useAppRedux.ts
│   ├── utils/
│   │   └── cache.ts         # LocalStorage caching
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env
```

## Features Implemented

### ✅ User Features
- User registration & login with JWT
- Product browsing with pagination
- Search products by name/description
- Filter products by category
- Filter by price range
- Add products to cart
- Manage cart (increase/decrease quantity, remove items)
- Place orders
- View order history
- User dashboard with purchase statistics

### ✅ Admin Features
- All user features
- Admin dashboard with analytics
- Category-wise sales statistics
- Revenue graphs
- Add new products
- Edit product details
- Delete products
- Filter products by category
- View all orders

### ✅ Technical Features
- JWT-based authentication
- Role-based access control
- Microservices architecture
- Separate MongoDB databases per service
- Backend caching with Redis
- Frontend caching with localStorage
- Type-safe code with TypeScript
- Responsive UI with Tailwind CSS
- Error handling and validation
- Input sanitization

## Caching Strategy

### Backend (Redis)
- Products: 300 seconds
- User profiles: 3600 seconds
- Search results: 180 seconds
- Dashboard stats: 600 seconds
- Category list: 1800 seconds

### Frontend (LocalStorage)
- Products: 5 minutes
- Cart: Persistent
- User data: Session-based

## Database Structure

### User Service DB
```
ecommerce_users
├── users (Collection)
│   ├── email (unique)
│   ├── password (hashed)
│   ├── name
│   ├── role (user/admin)
│   └── timestamps
```

### Product Service DB
```
ecommerce_products
├── products (Collection)
│   ├── name (text index)
│   ├── description (text index)
│   ├── price
│   ├── category (indexed)
│   ├── stock
│   ├── image
│   ├── rating
│   ├── reviews
│   └── timestamps
```

### Order Service DB
```
ecommerce_orders
├── orders (Collection)
│   ├── userId (indexed)
│   ├── items (array)
│   │   ├── productId
│   │   ├── quantity
│   │   └── price
│   ├── totalAmount
│   ├── status
│   ├── paymentMethod
│   └── timestamps
```

## Troubleshooting

### MongoDB Connection Failed
```
Make sure MongoDB is running:
brew services start mongodb-community     # macOS
sudo service mongod start                 # Linux
```

### Redis Connection Failed
Redis is optional. The app will work without it but caching will be disabled.

### Port Already in Use
```
Backend (5000):
lsof -i :5000
kill -9 <PID>

Frontend (3000):
lsof -i :3000
kill -9 <PID>
```

### Module Not Found Errors
```
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

### Backend (.env)
All predefined in the .env file. Update if needed:
- `PORT` - Backend server port (default: 5000)
- `MONGO_*_URL` - MongoDB connection strings
- `JWT_SECRET` - Secret for JWT signing
- `REDIS_*` - Redis configuration

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Development Tips

1. **Hot Reload**: Both backend and frontend support hot reload with `npm run dev`
2. **TypeScript**: All code is typed. Use `npm run build` to check types
3. **Redux DevTools**: Install Redux DevTools browser extension for debugging
4. **Network Tab**: Use browser DevTools to see API calls and responses
5. **Console Logging**: Errors are logged in both browser console and server terminal

## Next Steps

1. **Payment Integration**: Add Stripe or PayPal
2. **Email Notifications**: Send order confirmation emails
3. **Image Upload**: Allow users to upload product images
4. **Reviews & Ratings**: Let users review products
5. **Wishlist**: Add wishlist feature
6. **Coupon System**: Add discount codes
7. **Inventory Management**: Better stock tracking
8. **Advanced Analytics**: More detailed reports
9. **Push Notifications**: Real-time order updates
10. **Deployment**: Deploy to AWS, Vercel, or Render

## Support

For issues or questions:
1. Check the README.md in the root directory
2. Review error messages in console/terminal
3. Check MongoDB and Redis connections
4. Ensure all dependencies are installed

## License

MIT License - Feel free to use this project for learning and development.
