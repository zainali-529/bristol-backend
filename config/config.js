module.exports = {
  // Server Configuration
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  
  // CORS Configuration
  CLIENT_URL: process.env.CLIENT_URL,
  
  // API Configuration
  API_VERSION: process.env.API_VERSION,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : process.env.RATE_LIMIT_MAX_REQUESTS,
  
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  DEVELOPER_EMAILS: process.env.DEVELOPER_EMAILS,
};
