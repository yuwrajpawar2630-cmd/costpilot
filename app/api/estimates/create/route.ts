import { NextRequest, NextResponse } from "next/server";
import { requireUserId, checkEstimateUsage } from "@/lib/auth/session";
import {
  createLocalEstimate,
} from "@/lib/db/local-store";
import { MAX_PDF_SIZE_BYTES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const usage = await checkEstimateUsage(userId);

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Estimate limit reached. Upgrade your plan.",
          used: usage.used,
          limit: usage.limit,
        },
        { status: 402 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Untitled Project";
    const clientName = (formData.get("clientName") as string) || "Untitled Client";
    const projectLocation = (formData.get("projectLocation") as string) || "Austin, TX";
    const buildingType = (formData.get("buildingType") as string) || "Residential";
    const area = Number(formData.get("area")) || 2000;
    const floors = Number(formData.get("floors")) || 1;
    const quality = (formData.get("quality") as "Economy" | "Standard" | "Premium") || "Standard";
    const notes = (formData.get("notes") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Blueprint file required" }, { status: 400 });
    }

    const acceptedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!acceptedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|png|jpg|jpeg)$/)) {
      return NextResponse.json(
        { error: "Only PDF, PNG, and JPG/JPEG files are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 25MB limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const estimate = createLocalEstimate({
      userId,
      name,
      clientName,
      projectLocation,
      buildingType,
      area,
      floors,
      quality,
      notes,
      filename: file.name,
      fileBuffer: buffer,
    });

    // Upload to Supabase Storage if not in demo mode
    const { isDemoMode } = await import("@/lib/auth/session");
    if (!isDemoMode()) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = await createServiceClient();
      if (supabase) {
        const storagePath = `${estimate.id}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("blueprints")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase Storage upload error:", uploadError.message);
        }
      }
    }

    return NextResponse.json({ estimate }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
