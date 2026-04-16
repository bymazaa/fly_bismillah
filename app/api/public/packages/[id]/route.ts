import dbConnect from "@/connection/db";
import Package from "@/models/Package.model";

import { NextResponse } from "next/server";
type Props = {
  params: Promise<{ id: string }>;
};

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