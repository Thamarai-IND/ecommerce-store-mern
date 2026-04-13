# E-Commerce Admin Panel - Full Stack Application

This is a comprehensive full-stack e-commerce admin panel application built with React 19, Express.js, Node.js, MongoDB, Redux Toolkit, and TypeScript.

## Project Structure

```
CRUD/
├── client/              # React 19 Frontend
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux Toolkit store
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript types
│   │   ├── utils/       # Utility functions (caching, etc.)
│   │   ├── styles/      # Global styles
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   ├── index.html       # HTML template
│   ├── package.json     # Frontend dependencies
│   ├── tsconfig.json    # TypeScript configuration
│   └── vite.config.ts   # Vite configuration
│
└── server/              # Express.js Backend
    ├── src/
    │   ├── config/      # Configuration files
    │   ├── middleware/  # Express middleware
    │   ├── services/    # Microservices
    │   │   ├── user-service/      # User authentication & management
    │   │   ├── product-service/   # Product CRUD operations
    │   │   └── order-service/     # Orders & shopping cart
    │   ├── routes/      # API routes
    │   ├── types/       # TypeScript types
    │   ├── utils/       # Utility functions
    │   ├── app.ts       # Express app configuration
    │   └── server.ts    # Server entry point
    ├── package.json     # Backend dependencies
    ├── tsconfig.json    # TypeScript configuration
    └── .env             # Environment variables
```

## Features

### Frontend
- ✅ User and Admin Authentication with JWT
- ✅ Product listing, search, and filtering by category
- ✅ Shopping cart with add, remove, increase/decrease quantity
- ✅ Checkout and order placement
- ✅ User dashboard showing purchase history and statistics
- ✅ Admin dashboard with analytics (category-wise sales, revenue, etc.)
- ✅ Admin product management (add, edit, delete, update by category)
- ✅ Redux Toolkit for state management
- ✅ Frontend caching with localStorage
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety

### Backend
- ✅ Microservices Architecture
  - User Service (Authentication, User Management)
  - Product Service (Product CRUD, Search, Filter)
  - Order Service (Orders, Cart, Analytics)
- ✅ Each service has its own MongoDB instance
- ✅ JWT authentication for both users and admins
- ✅ Backend caching with Redis
- ✅ RESTful API endpoints
- ✅ Input validation and error handling
- ✅ TypeScript for type safety
- ✅ Express.js best practices

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (running on localhost:27017)
- Redis (running on localhost:6379) - Optional for backend caching

## Installation & Setup

### 1. Clone the repository
```bash
cd /fullstack/CRUD
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (already provided)
# Update DATABASE URLs if MongoDB is running on a different host

# Build TypeScript
npm run build

# Start the server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### User Service (`/api/users`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /profile/:userId` - Get user profile
- `PUT /:userId` - Update user profile
- `GET /` - Get all users (admin only)
- `DELETE /:userId` - Delete user (admin only)

### Product Service (`/api/products`)
- `GET /` - Get all products (with pagination)
- `GET /categories/list` - Get all categories
- `GET /search?q=query` - Search products
- `GET /filter` - Filter products by category, price, etc.
- `GET /category/:category` - Get products by category
- `GET /:productId` - Get product details
- `POST /` - Create product (admin only)
- `PUT /:productId` - Update product (admin only)
- `DELETE /:productId` - Delete product (admin only)

### Order Service (`/api/orders`)
- `POST /` - Create order (place order)
- `GET /user/:userId` - Get user orders
- `GET /` - Get all orders (admin only)
- `GET /:orderId` - Get order details
- `PUT /:orderId` - Update order status (admin only)
- `GET /dashboard/:userId` - Get user dashboard stats
- `GET /stats/category-sales` - Get category-wise sales stats (admin only)

## Caching Strategy

### Backend Caching (Redis)
- Products: 300 seconds
- User profiles: 3600 seconds
- Search results: 180 seconds
- Dashboard stats: 600 seconds
- Category list: 1800 seconds

### Frontend Caching (LocalStorage)
- Products: 5 minutes
- User data: Session
- Cart: Persistent until checkout
- Orders: 5 minutes

## Database Schema

### User Service Database (`ecommerce_users`)
- **Users** collection: email, password, name, role, timestamps

### Product Service Database (`ecommerce_products`)
- **Products** collection: name, description, price, category, stock, image, rating, reviews, timestamps
- Indexes: text index on name and description, category index

### Order Service Database (`ecommerce_orders`)
- **Orders** collection: userId, items (with productId, quantity, price), totalAmount, status, paymentMethod, timestamps
- Indexes: userId index, compound index on userId and createdAt

## Testing

### Register a New User
```bash
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```bash
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create Product (Admin Only)
```bash
POST http://localhost:5000/api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 1200,
  "category": "Electronics",
  "stock": 50,
  "image": "laptop.jpg"
}
```

### Create Order
```bash
POST http://localhost:5000/api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 1200
    }
  ],
  "totalAmount": 2400,
  "paymentMethod": "credit_card"
}
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGO_USER_SERVICE_URL=mongodb://localhost:27017/ecommerce_users
MONGO_PRODUCT_SERVICE_URL=mongodb://localhost:27017/ecommerce_products
MONGO_ORDER_SERVICE_URL=mongodb://localhost:27017/ecommerce_orders
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=refresh_secret_key
JWT_REFRESH_EXPIRE=30d
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Tech Stack

### Frontend
- React 19 (Canary)
- TypeScript
- Redux Toolkit
- React Router v6
- Tailwind CSS
- Recharts (for analytics)
- Lucide React (for icons)
- Axios (for API calls)
- Vite (build tool)

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Redis for caching
- Bcryptjs for password hashing

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications
- [ ] Inventory management
- [ ] Advanced analytics and reporting
- [ ] Product reviews and ratings
- [ ] Wishlists
- [ ] Coupon and discount codes
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Cloud deployment (AWS, Vercel, Render)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For support, email support@ecommerce.com or open an issue in the repository.
