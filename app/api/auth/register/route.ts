// app/api/auth/admin/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

// ==========================================
// Validation Helpers
// ==========================================
function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Name is required';
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name cannot exceed 50 characters';
  if (!/^[a-zA-Z\s.'\-]+$/.test(trimmed)) return 'Name contains invalid characters';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Invalid email format';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 128) return 'Password is too long';
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain at least one number';
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) return 'Invalid phone number';
  if (!/^\+?[0-9]+$/.test(cleaned)) return 'Phone contains invalid characters';
  return null;
}

function generateAdminId(): string {
  const prefix = 'ADM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ==========================================
// POST /api/auth/admin/register
// ==========================================
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // ── Parse Body ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, email, password, confirmPassword, phone, agreeToTerms } = body as {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone?: string;
      agreeToTerms?: boolean;
    };

    // ── Validate Name ──
    const nameErr = validateName(name);
    if (nameErr) {
      return NextResponse.json(
        { success: false, message: nameErr, field: 'name' },
        { status: 400 }
      );
    }

    // ── Validate Email ──
    const emailErr = validateEmail(email);
    if (emailErr) {
      return NextResponse.json(
        { success: false, message: emailErr, field: 'email' },
        { status: 400 }
      );
    }

    // ── Validate Password ──
    const pwErr = validatePassword(password);
    if (pwErr) {
      return NextResponse.json(
        { success: false, message: pwErr, field: 'password' },
        { status: 400 }
      );
    }

    // ── Confirm Password ──
    if (!confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Please confirm your password', field: 'confirmPassword' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match', field: 'confirmPassword' },
        { status: 400 }
      );
    }

    // ── Validate Phone ──
    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        return NextResponse.json(
          { success: false, message: phoneErr, field: 'phone' },
          { status: 400 }
        );
      }
    }

    // ── Terms ──
    if (!agreeToTerms) {
      return NextResponse.json(
        { success: false, message: 'You must agree to the terms and conditions', field: 'terms' },
        { status: 400 }
      );
    }

    // ── Check Duplicate ──
    const normalizedEmail = email.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    // ── Admin Limit ──
    const totalAdmins = await Admin.countDocuments({ role: 'admin' });
    if (totalAdmins >= 5) {
      return NextResponse.json(
        { success: false, message: 'Maximum admin accounts reached. Contact super admin.' },
        { status: 403 }
      );
    }

    // ── Generate Unique AdminId ──
    let adminId = generateAdminId();
    let attempts = 0;
    while (await Admin.findOne({ adminId })) {
      adminId = generateAdminId();
      attempts++;
      if (attempts >= 10) {
        return NextResponse.json(
          { success: false, message: 'Failed to generate unique ID. Try again.' },
          { status: 500 }
        );
      }
    }

    // ── Hash Password ──
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create Admin ──
    const admin = await Admin.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || null,
      adminId,
      role: 'admin',
      status: 'active',
      isVerified: true,
      isOnline: false,
      isTwoFactorEnabled: false,
      permissions: {
        dashboard: 'full',
        booking: 'full',
        transactions: 'full',
        customers: 'full',
        destinations: 'full',
        packages: 'full',
        offers: 'full',
        support: 'full',
        staff: 'full',
        settings: 'full',
        reports: 'full',
      },
      failedLoginAttempts: 0,
      lockUntil: null,
      loginHistory: [],
      activeSessions: [],
      blockReason: null,
      blockedAt: null,
      blockedBy: null,
      createdBy: null,
    });

    // ── Return Success (no token, no cookie) ──
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please login to continue.',
        data: {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            adminId: admin.adminId,
            role: admin.role,
          },
        },
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('[REGISTER ERROR]', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      const mongoErr = error as any;
      const firstKey = Object.keys(mongoErr.errors)[0];
      const firstErr = mongoErr.errors[firstKey];
      return NextResponse.json(
        { success: false, message: firstErr?.message || 'Validation failed', field: firstKey },
        { status: 400 }
      );
    }

    if (error instanceof Error && (error as any).code === 11000) {
      const field = Object.keys((error as any).keyPattern || {})[0] || 'email';
      return NextResponse.json(
        {
          success: false,
          message: field === 'email' ? 'Account already exists with this email' : `Duplicate ${field}`,
          field,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}