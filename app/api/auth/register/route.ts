import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const existing = await db.collection("auth_users").findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const id = randomUUID();
    const hashedPassword = hashPassword(password);

    await db.collection("auth_users").insertOne({
      _id: id as any,
      name: name || email.split("@")[0],
      email,
      emailVerified: null,
      image: null,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, userId: id });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
