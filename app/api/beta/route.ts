import { NextRequest, NextResponse } from "next/server";
import { addBetaSignup } from "@/lib/db/local-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();
    const company_name = (body.company_name as string)?.trim();
    const role = (body.role as string)?.trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const signup = addBetaSignup({ email, company_name, role });
    return NextResponse.json({ signup }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Beta signup API" });
}
