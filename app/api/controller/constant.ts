export const ADMIN_ROLE = 'admin';
export const USER_ROLE = 'user';

export const TOKEN_EXPIRATION = '1d'; // Token expiration time
export const JWT_ALGORITHM = 'HS256'; // JWT signing algorithm

export const COOKIE_NAME = 'auth_token'; // Name of the authentication cookie
export const SESSION_EXPIRATION = 30 * 24 * 60 * 60; // Session expiration time in seconds (30 days)

export const SALT_ROUNDS = 10; // Number of salt rounds for password hashing
export const MAX_LOGIN_ATTEMPTS = 5; // Maximum login attempts before lockout
export const LOCKOUT_DURATION = 1 * 60 * 1000; // Lockout duration in milliseconds (30 minutes)
export const PASSWORD_RESET_TOKEN_EXPIRATION = 15 * 60 * 1000; // Password reset token expiration time in milliseconds (15 minutes)
export const EMAIL_VERIFICATION_TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // Email verification token expiration time in milliseconds (24 hours)
export const API_RATE_LIMIT = 100; // Maximum number of API requests per time window
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // Rate limit time window in milliseconds (15 minutes)
export const JWT_SECRET = process.env.JWT_SECRET! || 'your-default-secret-key'; // JWT secret key
export const SERVER_PORT = process.env.PORT || 3000; // Server port number
export const DATABASE_URL = process.env.MONGODB_URI // Database connection URL
export const APP_URL ="https://flybismillah.com"; // Application URL

export const MIN_PASSWORD=6
export const MAX_PASSWORD=64

export const MAX_DEVICE=10