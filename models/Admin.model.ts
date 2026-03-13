// models/Admin.ts

import { Schema, model, models, Model, Document } from 'mongoose';
import { IAdmin } from '@/types/admin';

export type AdminDocument = IAdmin & Document;

const AdminSchema = new Schema<AdminDocument>(
  {
    // ===== 👤 Basic Info =====
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    phone: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    adminId: {
      type: String,
      unique: true,
    },

    // ===== 🎭 Role & Status =====
    role: {
      type: String,
      enum: {
        values: ['admin', 'viewer', 'editor'],
        message: '{VALUE} is not a valid role',
      },
      default: 'editor',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'blocked', 'suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },

    // ===== 🔐 Permissions =====
    permissions: {
      dashboard: {
        type: String,
        enum: ['full',  'none'],
        default: 'full',
      },
      booking: {
        type: String,
        enum: ['full',  'view', 'none','edit'],
        default: 'view',
      },
      transactions: {
        type: String,
        enum: ['full',  'none'],
        default: 'full',
      },
      customers: {
        type: String,
        enum: ['full',  'none'],
        default: 'full',
      },
      destinations: {
        type: String,
         enum: ['full', 'edit', 'view', 'none'],
        default: 'view',
      },
      packages: {
        type: String,
         enum: ['full', 'edit', 'view', 'none'],
        default: 'view',
      },
      offers: {
        type: String,
        enum: ['full', 'edit', 'view', 'none'],
        default: 'view',
      },
      support: {
        type: String,
        enum: ['full',  'none'],
        default: 'full',
      },
      settings: {
        type: String,
        enum: ['full',  'none'],
        default: 'none',
      }
    },

    // ===== 👨‍💼 Staff Tracking =====
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    // ===== 🛡️ Security =====
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // ===== 🔄 Password Reset =====
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    // ===== 🕐 Login & Activity =====
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },

    // ===== 📱 Login History =====
    loginHistory: [
      {
        device: { type: String },
        browser: { type: String },
        ip: { type: String },
        location: { type: String },
        time: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['current', 'completed'],
          default: 'current',
        },
      },
    ],

    // ===== 🔑 Active Sessions =====
    activeSessions: [
      {
        sessionId: { type: String, required: true },
        device: { type: String },
        browser: { type: String },
        ip: { type: String },
        location: { type: String },
        loginTime: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],

    // ===== 🔒 Two Factor Auth =====
    twoFactorSecret: {
      type: String,
      default: null,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // ===== 🚫 Block Info =====
    blockedAt: {
      type: Date,
      default: null,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    blockReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
AdminSchema.index({ role: 1, status: 1 });
AdminSchema.index({ createdBy: 1 });

const Admin: Model<AdminDocument> =
  models.Admin || model<AdminDocument>('Admin', AdminSchema);

export default Admin;