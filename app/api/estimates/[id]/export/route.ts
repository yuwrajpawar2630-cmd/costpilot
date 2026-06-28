import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { requireUserId } from "@/lib/auth/session";
import { getLocalEstimate } from "@/lib/db/local-store";
import { renderEstimatePdf } from "@/lib/reports/generate-report";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const estimate = getLocalEstimate(id, userId);

    if (!estimate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (estimate.status !== "completed") {
      return NextResponse.json(
        { error: "Estimate not ready" },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;

    if (estimate.report_storage_path) {
      const filePath = join(process.cwd(), ".data", estimate.report_storage_path);
      if (existsSync(filePath)) {
        pdfBuffer = readFileSync(filePath);
      } else {
        pdfBuffer = await renderEstimatePdf(estimate);
      }
    } else {
      pdfBuffer = await renderEstimatePdf(estimate);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="costpilot-estimate-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
