// app/api/admin/offers/[id]/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Offer from '@/models/Offer.model';
import { hasPermission } from '@/app/api/lib/auth';

const offerSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(1),
  description: z.string().min(10),
  image: z.string().url(),
  whatsappMessage: z.string().min(1),
  isLarge: z.boolean(),
  isActive: z.boolean(),
});

// ═══════════════════════════════════════════
// GET — Single Offer দেখা
// Permission: offers → "view"
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
  // const auth = await hasPermission('offers', 'view');
  // if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();

    const offer = await Offer.findById(params.id);

    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found' },
        { status: 404 }
      );
    }

    if (!offer.isActive) {
      return NextResponse.json(
        { success: false, message: 'Offer is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: offer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server Error', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PUT — Offer সম্পূর্ণ update করা
// Permission: offers → "edit"
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
  const auth = await hasPermission('offers', 'edit');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();
    const body = await req.json();

    const validation = offerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation Error', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully',
      data: updatedOffer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Update Failed', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PATCH — Offer publish/hide toggle (isActive)
// Permission: offers → "edit"
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
  const auth = await hasPermission('offers', 'edit');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();
    const body = await req.json();

    const updatedOffer = await Offer.findByIdAndUpdate(
      params.id,
      { isActive: body.isActive },
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: body.isActive ? 'Offer Published' : 'Offer Hidden',
      data: updatedOffer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Status Update Failed', error: error.message },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// DELETE — Offer মুছে ফেলা
// Permission: offers → "full"
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
  const auth = await hasPermission('offers', 'full');
  if (!auth.success) return auth.response;

  try {
    const params = await props.params;
    await dbConnect();

    const deletedOffer = await Offer.findByIdAndDelete(params.id);

    if (!deletedOffer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Delete Failed', error: error.message },
      { status: 500 }
    );
  }
}