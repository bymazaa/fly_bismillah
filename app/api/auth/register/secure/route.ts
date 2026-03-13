import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin.model';
import dbConnect from '@/connection/db';
import { SALT_ROUNDS } from '@/app/api/controller/constant';


export async function POST(req: Request) {
let  role="admin"

  try {
    await dbConnect();

    const body = await req.json();
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, Email and Password are required." },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,          
    });

    return NextResponse.json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!`,
      userId: newStaff._id
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}