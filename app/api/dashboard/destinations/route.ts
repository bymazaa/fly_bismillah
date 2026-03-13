// app/api/admin/destinations/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Destination from '@/models/Destination.model';
import { hasPermission } from '../../lib/auth';

// ─── Validation Schema ───
const destinationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  country: z.string().min(2, 'Country is required'),
  description: z.string().min(10, 'Description is too short'),
  currency: z.string().min(1, 'Currency is required'),
  language: z.string().min(1, 'Language is required'),
  bestTime: z.string().min(1, 'Best time is required'),
  rating: z.number().default(5),
  reviews: z.number().default(0),
  attractions: z.array(z.string()).min(1, 'At least 1 attraction required'),
  gallery: z.array(z.string()).min(1, 'At least 1 gallery image required'),
  image: z.string().url('Valid image URL is required'),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════
// GET — Destination list দেখা
// Permission: destinations → "view"
//
// ✅ admin  (full ≥ view)
// ✅ editor (view ≥ view)  
// ✅ viewer (view ≥ view)
// ❌ none permission → blocked
// ═══════════════════════════════════════════

export async function GET() {
  const auth = await hasPermission('destinations', 'view');
  if (!auth.success) return auth.response;

  try {
    await dbConnect();

    const destinations = await Destination.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: destinations.length,
      data: destinations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server Error', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// POST — নতুন Destination তৈরি
// Permission: destinations → "edit"
//
// ✅ admin  (full ≥ edit)
// ✅ editor (edit ≥ edit)  — if destinations permission is "edit"
// ❌ viewer (view < edit)
// ❌ none   (none < edit)
// ═══════════════════════════════════════════

export async function POST(req: Request) {
  const auth = await hasPermission('destinations', 'edit');
  if (!auth.success) return auth.response;

  try {
    await dbConnect();

    const body = await req.json();
    const validation = destinationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error',
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingDestination = await Destination.findOne({ slug: data.slug });
    if (existingDestination) {
      return NextResponse.json(
        { success: false, message: 'A destination with this name already exists.' },
        { status: 409 }
      );
    }

    const newDestination = await Destination.create({ ...data });

    return NextResponse.json(
      {
        success: true,
        message: 'Destination created successfully!',
        data: newDestination,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}