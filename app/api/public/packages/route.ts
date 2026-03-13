export const dynamic = 'force-dynamic';
import dbConnect from "@/connection/db";
import Package from "@/models/Package.model";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const packages = await Package.find({
        isFeatured: true,
    })
      .sort({ createdAt: -1 })

      if(!packages){
        return NextResponse.json(
          { error: "No packages found" }, 
          { status: 404 }
        );
      }
      

    return NextResponse.json({
      success: true,
      data: packages
    });

  } catch (error: any) {
    console.error("Get Packages Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}