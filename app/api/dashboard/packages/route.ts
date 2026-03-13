// app/api/admin/packages/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Package from '@/models/Package.model';
import { generatedSlug } from '@/app/admin/(content)/utils/main';
import { hasPermission } from '../../lib/auth';
import { packageApiSchema } from './validation';

// ═══════════════════════════════════════════
// GET — Package list দেখা
// Permission: packages → "view"
//
// ✅ admin   (full ≥ view)
// ✅ editor  (edit ≥ view)
// ✅ viewer  (view ≥ view)
// ❌ none
// ═══════════════════════════════════════════

export async function GET() {
  const auth = await hasPermission('packages', 'view');
  if (!auth.success) return auth.response;

  try {
    await dbConnect();
    const packages = await Package.find({}).sort({ createdAt: -1 });

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No packages found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// POST — নতুন Package তৈরি
// Permission: packages → "edit"
//
// ✅ admin   (full ≥ edit)
// ✅ editor  (edit ≥ edit)
// ❌ viewer  (view < edit)
// ❌ none
// ═══════════════════════════════════════════

export async function POST(req: Request) {
  const auth = await hasPermission('packages', 'edit');
  if (!auth.success) return auth.response;

  try {
    await dbConnect();
    const body = await req.json();

    const validation = packageApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const slug = generatedSlug(data.title);

    const newPackage = await Package.create({
      title: data.title,
      slug,
      price: data.price,
      image: data.imageUrl,
      category: data.category,
      location: data.location,
      description: data.description,
      included: data.included,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Package created successfully',
        data: newPackage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'A package with this title already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}