import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildAcceptancePdf(record: {
  title: string;
  version: string;
  legalName: string;
  email: string;
  acceptedAt: string;
  contentHash: string;
  sectionCount: number;
  declarationCount: number;
}): Uint8Array {
  const lines = [
    record.title,
    "",
    `Version: ${record.version}`,
    `Accepted by: ${record.legalName}`,
    `Email: ${record.email}`,
    `Accepted at (UTC): ${record.acceptedAt}`,
    `Content hash: ${record.contentHash}`,
    "",
    `Sections accepted: ${record.sectionCount}`,
    `Declarations accepted: ${record.declarationCount}`,
    "",
    "This document is an electronic record of acceptance of the agreement above.",
  ];

  const contentStream = "BT\n/F1 11 Tf\n72 720 Td\n14 TL\n" +
    lines.map((l) => `(${escapePdfText(l)}) Tj`).join("\n") + "\nET";

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>";
  const contentBytes = new TextEncoder().encode(contentStream);
  objects[4] = `<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream`;
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer ", "");
    if (!authToken) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: { user }, error: authErr } = await client.auth.getUser(authToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Invalid session" }), { status: 401, headers: corsHeaders });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    const termsVersionId = body.termsVersionId as string;
    const legalName = ((body.legalName as string) || "").trim();
    const typedSignature = ((body.typedSignature as string) || "").trim();
    const sectionAcceptances = Array.isArray(body.sectionAcceptances) ? (body.sectionAcceptances as any[]) : [];
    const declarationAcceptances = Array.isArray(body.declarationAcceptances) ? (body.declarationAcceptances as any[]) : [];
    const contentHash = (body.contentHash as string) || "";

    if (!termsVersionId || typeof termsVersionId !== "string") {
      return new Response(JSON.stringify({ success: false, message: "termsVersionId is required" }), { status: 400, headers: corsHeaders });
    }
    if (!legalName || legalName.length < 2) {
      return new Response(JSON.stringify({ success: false, message: "Legal name is required" }), { status: 400, headers: corsHeaders });
    }
    if (!typedSignature || typedSignature.toLowerCase() !== legalName.toLowerCase()) {
      return new Response(JSON.stringify({ success: false, message: "Typed signature must match legal name" }), { status: 400, headers: corsHeaders });
    }
    if (sectionAcceptances.length === 0 || sectionAcceptances.some((s: any) => !s || s.confirmed !== true)) {
      return new Response(JSON.stringify({ success: false, message: "All sections must be accepted" }), { status: 400, headers: corsHeaders });
    }
    if (declarationAcceptances.length === 0 || declarationAcceptances.some((d: any) => !d || d.confirmed !== true)) {
      return new Response(JSON.stringify({ success: false, message: "All declarations must be accepted" }), { status: 400, headers: corsHeaders });
    }

    const { data: version, error: verErr } = await client
      .from("uat_terms_versions")
      .select("id, version, title, is_active")
      .eq("id", termsVersionId)
      .maybeSingle();

    if (verErr || !version) {
      return new Response(JSON.stringify({ success: false, message: "Terms version not found" }), { status: 404, headers: corsHeaders });
    }
    if (!(version as any).is_active) {
      return new Response(JSON.stringify({ success: false, message: "This terms version is not active" }), { status: 400, headers: corsHeaders });
    }

    const { data: existing } = await client
      .from("uat_terms_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("terms_version_id", termsVersionId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyAccepted: true }), { headers: corsHeaders });
    }

    const acceptedAt = new Date().toISOString();
    const { data: acceptance, error: insErr } = await client
      .from("uat_terms_acceptances")
      .insert({
        user_id: user.id,
        terms_version_id: termsVersionId,
        tester_email: user.email || "",
        legal_name: legalName,
        typed_signature: typedSignature,
        section_acceptances: sectionAcceptances,
        declaration_acceptances: declarationAcceptances,
        accepted_at: acceptedAt,
        content_hash: contentHash,
        user_agent: req.headers.get("user-agent") || null,
      })
      .select("id")
      .single();

    if (insErr || !acceptance) {
      return new Response(JSON.stringify({ success: false, message: `Failed to record acceptance: ${insErr?.message}` }), { status: 500, headers: corsHeaders });
    }

    try {
      const pdfBytes = buildAcceptancePdf({
        title: (version as any).title || "DFP UAT Tester Terms",
        version: (version as any).version || "",
        legalName,
        email: user.email || "",
        acceptedAt,
        contentHash,
        sectionCount: sectionAcceptances.length,
        declarationCount: declarationAcceptances.length,
      });

      const storagePath = `acceptances/${acceptance.id}.pdf`;

      let bucketFound = true;
      try { await client.storage.getBucket("uat-legal-agreements"); } catch { bucketFound = false; }
      if (!bucketFound) {
        await client.storage.createBucket("uat-legal-agreements", { public: false });
      }

      const { error: upErr } = await client.storage
        .from("uat-legal-agreements")
        .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

      if (!upErr) {
        await client
          .from("uat_terms_acceptances")
          .update({ pdf_storage_path: storagePath })
          .eq("id", acceptance.id);
      }
    } catch {
      // PDF generation is best-effort; acceptance record remains authoritative.
    }

    return new Response(JSON.stringify({ success: true, acceptance_id: acceptance.id }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
