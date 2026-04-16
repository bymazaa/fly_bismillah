import dbConnect from "@/connection/db";
import Destination from "@/models/Destination.model";
import { NextResponse } from "next/server";

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