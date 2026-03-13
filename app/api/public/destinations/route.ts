export const dynamic = 'force-dynamic';
import dbConnect from "@/connection/db";
import Destination from "@/models/Destination.model";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        const destinations = await Destination.find({ 
            isActive: true
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            count: destinations.length,
            data: destinations,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Server Error', error: error.message },
            { status: 500 },
        );
    }
}
