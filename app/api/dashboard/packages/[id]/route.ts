// app/api/admin/packages/[id]/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Package from '@/models/Package.model';
import { hasPermission } from '@/app/api/lib/auth';
import { generatedSlug } from '@/app/admin/(content)/utils/main';
import { packageSchema } from '@/app/admin/(content)/validation/package';

type Props = {
  params: Promise<{ id: string }>;
};

// ═══════════════════════════════════════════
// GET — Single Package দেখা
// Permission: packages → "view"
//
// ✅ admin   (full ≥ view)
// ✅ editor  (edit ≥ view)
// ✅ viewer  (view ≥ view)
// ❌ none
// ═══════════════════════════════════════════

export async function GET(req: Request, { params }: Props) {
  // const auth = await hasPermission('packages', 'view');
  // if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    await dbConnect();

    const singlePackage = await Package.findById(id);

    if (!singlePackage) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    if (!singlePackage.isFeatured) {
      return NextResponse.json(
        { success: false, message: 'Package is not published' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: singlePackage },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PUT — Package সম্পূর্ণ update করা
// Permission: packages → "edit"
//
// ✅ admin   (full ≥ edit)
// ✅ editor  (edit ≥ edit)
// ❌ viewer  (view < edit)
// ❌ none
// ═══════════════════════════════════════════

export async function PUT(req: Request, { params }: Props) {
  const auth = await hasPermission('packages', 'edit');
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const validation = packageSchema.safeParse(body);
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
    const newSlug = generatedSlug(data.title);

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      {
        title: data.title,
        slug: newSlug,
        price: data.price,
        image: data.imageUrl,
        category: data.category,
        location: data.location,
        description: data.description,
        included: data.included.map((item: any) => item.value),
      },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      data: updatedPackage,
    });
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

// ═══════════════════════════════════════════
// PATCH — Package publish/hide toggle (isFeatured)
// Permission: packages → "edit"
//
// ✅ admin   (full ≥ edit)
// ✅ editor  (edit ≥ edit)
// ❌ viewer  (view < edit)
// ❌ none
// ═══════════════════════════════════════════

export async function PATCH(req: Request, { params }: Props) {
  const auth = await hasPermission('packages', 'edit');
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { $set: { isFeatured: body.isFeatured } },
      { new: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: body.isFeatured ? 'Package Published' : 'Package Hidden',
      data: updatedPackage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// DELETE — Package মুছে ফেলা
// Permission: packages → "full"
//
// ✅ admin   (full ≥ full)
// ❌ editor  (edit < full)
// ❌ viewer  (view < full)
// ❌ none
// ═══════════════════════════════════════════

export async function DELETE(req: Request, { params }: Props) {
  const auth = await hasPermission('packages', 'full');
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    await dbConnect();

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}