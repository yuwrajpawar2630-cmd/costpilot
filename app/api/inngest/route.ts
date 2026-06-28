import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions/analyze-blueprint";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
