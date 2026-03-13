import mongoose from 'mongoose';
import { DATABASE_URL } from '@/app/api/controller/constant';

// ──────────────────────────────────────────────
// Validate environment variable at startup
// ──────────────────────────────────────────────

const MONGODB_URI = DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error(
    'MongoDB URI is not defined. Set MONGODB_URI in your .env file.'
  );
}

// ──────────────────────────────────────────────
// Global connection cache
// Prevents re-connecting on every hot-reload in Next.js dev mode
// ──────────────────────────────────────────────

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseConnection | undefined;
}

const cached: MongooseConnection = global._mongoose ?? {
  conn: null,
  promise: null,
};

if (!global._mongoose) {
  global._mongoose = cached;
}

// ──────────────────────────────────────────────
// Register connection lifecycle events (runs once)
// ──────────────────────────────────────────────

function registerConnectionEvents() {
  if (mongoose.connection.listenerCount('connected') > 0) return; // Already registered

  mongoose.connection.on('connected', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MongoDB] Connected');
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected — attempting to reconnect...');
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
    cached.conn = null;
    cached.promise = null;
  });
}

// ──────────────────────────────────────────────
// dbConnect — returns a cached or new connection
// ──────────────────────────────────────────────

async function dbConnect(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Start a new connection if none is in progress
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
    };

    registerConnectionEvents();

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  // Await the connection and cache the result
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise so the next call can retry the connection
    cached.promise = null;
    console.error('[MongoDB] Failed to connect:', err);
    throw err;
  }

  return cached.conn;
}

export default dbConnect;