# Bristol Utilities Backend

A Node.js backend API built with Express.js and MongoDB for the Bristol Utilities application.

## Features

- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure user authentication
- **Security Middleware** - Helmet, CORS protection
- **Environment Configuration** - Dotenv for environment variables
- **Error Handling** - Centralized error handling middleware
- **Logging** - Morgan HTTP request logger

## Project Structure

```
backend/
├── config/
│   ├── database.js      # MongoDB connection configuration
│   └── config.js        # Application configuration
├── controllers/         # Route controllers
├── middleware/
│   ├── auth.js         # Authentication middleware
│   └── errorHandler.js # Error handling middleware
├── models/             # Mongoose models
├── routes/             # API routes
├── services/           # Business logic services
├── utils/              # Utility functions
├── .env                # Environment variables
├── server.js           # Main application file
└── package.json        # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` file and update the values
   - Set your MongoDB connection string
   - Update JWT secret key

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the application:

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /` - Basic server information
- `GET /api/v1/health` - Health check endpoint

### Authentication (Coming Soon)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/bristol_utilities |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

## Next Steps

1. Create your models in the `models/` folder
2. Add route handlers in the `controllers/` folder
3. Define API routes in the `routes/` folder
4. Add business logic in the `services/` folder
5. Create utility functions in the `utils/` folder

## Contributing

1. Create a feature branch
2. Make your changes
3. Test your changes
4. Submit a pull request