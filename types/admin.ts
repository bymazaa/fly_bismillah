// types/admin.ts

import { Types } from 'mongoose';

export interface ILoginHistory {
  _id?: Types.ObjectId;
  device: string;
  browser: string;
  ip: string;
  location: string;
  time: Date;
  status: 'current' | 'completed';
}

export interface IActiveSession {
  _id?: Types.ObjectId;
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: Date;
  lastActive: Date;
}

// types/admin.ts — permissions অংশটা update করো

export interface IPermissions {
  dashboard: 'full' | 'view' | 'none';
  booking: 'full' | 'edit' | 'view' | 'none';
  transactions: 'full' | 'edit' | 'view' | 'none';
  customers: 'full' | 'view' | 'none';
  destinations: 'full' | 'view' | 'none';
  packages: 'full' | 'view' | 'none';
  offers: 'full' | 'view' | 'none';
  support: 'full' | 'view' | 'none';
  staff: 'full' | 'view' | 'none';
  settings: 'full' | 'view' | 'none';
  reports: 'full' | 'view' | 'none';
}

export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  avatar: string | null;
  adminId: string;
  role: 'admin' | 'viewer' | 'editor';
  status: 'active' | 'blocked' | 'suspended';
  isVerified: boolean;
  permissions: IPermissions;
  createdBy: Types.ObjectId | null;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
  lastLogin: Date;
  lastActive: Date;
  isOnline: boolean;
  loginHistory: ILoginHistory[];
  activeSessions: IActiveSession[];
  twoFactorSecret: string | null;
  isTwoFactorEnabled: boolean;
  blockedAt: Date | null;
  blockedBy: Types.ObjectId | null;
  blockReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  action: string;
  target: Types.ObjectId | null;
  targetModel: string;
  details: string;
  ip: string;
  device: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IStaffListResponse {
  staff: Partial<IAdmin>[];
  pagination: IPagination;
  stats: {
    total: number;
    active: number;
    blocked: number;
    online: number;
  };
}

export interface ICreateStaffBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'editor' | 'viewer';
  permissions?: Partial<IPermissions>;
}

export interface IUpdateStaffBody {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: 'admin' | 'editor' | 'viewer';
  permissions?: Partial<IPermissions>;
  isVerified?: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface IBlockStaffBody {
  reason?: string;
}

// JWT Payload
export interface IJwtPayload {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}