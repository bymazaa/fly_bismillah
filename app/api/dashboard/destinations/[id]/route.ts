// app/api/admin/destinations/[id]/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Destination from '@/models/Destination.model';
import { hasPermission } from '@/app/api/lib/auth';

const destinationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(1),
  country: z.string().min(2),
  description: z.string().min(10),
  currency: z.string().min(1),
  language: z.string().min(1),
  bestTime: z.string().min(1),
  rating: z.number(),
  reviews: z.number(),
  image: z.string().url(),
  gallery: z.array(z.string()).min(1),
  attractions: z.array(z.string()).min(1),
  isActive: z.boolean(),
});

// ═══════════════════════════════════════════
// GET — Single destination দেখা
// Permission: destinations → "view"
//
// ✅ admin   (full ≥ view)
// ✅ editor  (edit ≥ view)
// ✅ viewer  (view ≥ view)
// ❌ none
// ═══════════════════════════════════════════

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  // const auth = await hasPermission('destinations', 'view');
  // if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();

    const destination = await Destination.findById(params.id);

    if (!destination) {
      return NextResponse.json(
        { success: false, message: 'Destination not found' },
        { status: 404 }
      );
    }

    if (!destination.isActive) {
      return NextResponse.json(
        { success: false, message: 'Destination is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: destination });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server Error', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PUT — Destination update করা
// Permission: destinations → "edit"
//
// ✅ admin   (full ≥ edit)
// ✅ editor  (edit ≥ edit)
// ❌ viewer  (view < edit)
// ❌ none
// ═══════════════════════════════════════════

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await hasPermission('destinations', 'edit');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
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

    const updatedDestination = await Destination.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true }
    );

    if (!updatedDestination) {
      return NextResponse.json(
        { success: false, message: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      data: updatedDestination,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Update Failed', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// DELETE — Destination মুছে ফেলা
// Permission: destinations → "full"
//
// ✅ admin   (full ≥ full)
// ❌ editor  (edit < full)
// ❌ viewer  (view < full)
// ❌ none
// ═══════════════════════════════════════════

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await hasPermission('destinations', 'full');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();

    const deletedDestination = await Destination.findByIdAndDelete(params.id);

    if (!deletedDestination) {
      return NextResponse.json(
        { success: false, message: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Destination deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Delete Failed', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PATCH — Destination status toggle (isActive)
// Permission: destinations → "edit"
//
// ✅ admin   (full ≥ edit)
// ✅ editor  (edit ≥ edit)
// ❌ viewer  (view < edit)
// ❌ none
// ═══════════════════════════════════════════

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await hasPermission('destinations', 'edit');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();

    const body = await req.json();

    const updatedDestination = await Destination.findByIdAndUpdate(
      params.id,
      { isActive: body.isActive },
      { new: true }
    );

    if (!updatedDestination) {
      return NextResponse.json(
        { success: false, message: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: body.isActive ? 'Destination Published' : 'Destination Hidden',
      data: updatedDestination,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Status Update Failed', error: error.message },
      { status: 500 }
    );
  }
}