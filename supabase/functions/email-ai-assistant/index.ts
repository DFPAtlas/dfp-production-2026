import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(request: Request): { headers: Record<string, string>; originAllowed: boolean } {
  const origin = request.headers.get("origin");
  const appOrigin = Deno.env.get("DFP_APP_ORIGIN") || "https://digital-footprint.uk";
  const adminOrigin = Deno.env.get("DFP_ADMIN_ORIGIN") || "https://digital-footprint.uk";
  const devOrigin = Deno.env.get("DFP_DEV_ORIGIN");
  const allowedOrigins = Deno.env.get("DFP_ALLOWED_ORIGINS");

  let originAllowed = false;
  if (origin) {
    if (origin === appOrigin || origin === adminOrigin) originAllowed = true;
    if (devOrigin && origin === devOrigin) originAllowed = true;
    if (allowedOrigins) {
      const origins = allowedOrigins.split(",").map(function (o) { return o.trim(); });
      if (origins.includes(origin)) originAllowed = true;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (originAllowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
    headers["Access-Control-Allow-Headers"] = "authorization, x-client-info, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return { headers, originAllowed };
}

interface AIRequest {
  capability: string;
  payload: Record<string, unknown>;
  organisation_id?: string;
  template_id?: string;
  campaign_id?: string;
  brand_id?: string;
}

interface AIModelConfig {
  provider: string;
  model: string;
  api_key: string;
  base_url?: string;
  max_input_tokens: number;
  max_output_tokens: number;
  temperature: number;
  request_timeout_ms: number;
}

function buildSystemPrompt(capability: string, brandContext: Record<string, unknown> | null): string {
  const basePersona = "You are an AI email writing assistant for the Digital Footprint Email Studio. You help create professional, compliant email content. Never invent claims, testimonials, prices, guarantees, addresses, legal information, or customer data. Only use brand facts that are explicitly provided. Flag missing information rather than fabricating it.";
  let brandSection = "";
  if (brandContext) {
    brandSection = "\n\nBrand Context:\n";
    if (brandContext.name) brandSection += `- Brand: ${brandContext.name}\n`;
    if (brandContext.product_name) brandSection += `- Product: ${brandContext.product_name}\n`;
    if (brandContext.positioning) brandSection += `- Positioning: ${brandContext.positioning}\n`;
    if (brandContext.tone) brandSection += `- Approved Tone: ${brandContext.tone}\n`;
    if (brandContext.preferred_terms && Array.isArray(brandContext.preferred_terms)) brandSection += `- Preferred Terms: ${(brandContext.preferred_terms as string[]).join(", ")}\n`;
    if (brandContext.restricted_phrases && Array.isArray(brandContext.restricted_phrases)) brandSection += `- Restricted Phrases (avoid): ${(brandContext.restricted_phrases as string[]).join(", ")}\n`;
  }
  const capabilityPrompts: Record<string, string> = {
    "subject_lines": `${basePersona}${brandSection}\n\nTask: Generate multiple email subject line options based on the provided context. Return exactly the number requested. Each subject should be distinct in tone and approach. Keep them concise and within character limits. Flag any potential issues with punctuation, urgency, or misleading wording.`,
    "preview_text": `${basePersona}${brandSection}\n\nTask: Generate email preview text options that complement but do not repeat the subject line. Keep within character limits. Show the combined inbox preview.`,
    "rewrite_text": `${basePersona}${brandSection}\n\nTask: Rewrite the provided text according to the specified instruction. Show the original, the suggested version, and a brief summary of key changes made.`,
    "draft_from_brief": `${basePersona}${brandSection}\n\nTask: Generate a complete email draft based on the provided brief. Include subject line suggestions, preview text, an outline, the draft body, a call to action, and an optional alternative version. Map content into sections that can be applied to the email editor.`,
    "cta_suggestions": `${basePersona}${brandSection}\n\nTask: Generate call-to-action button label and supporting copy options. Avoid vague labels like "Click here". Suggest clearer alternatives. Do not create false urgency or deceptive wording.`,
    "content_review": `${basePersona}${brandSection}\n\nTask: Analyse the provided email content and return improvement suggestions for clarity, tone consistency, repetition, long paragraphs, weak CTAs, missing context, reading difficulty, accessibility, image alt text, link wording, subject/body consistency, brand consistency, unsupported claims, mobile readability, and missing plain-text content.`,
    "accessibility_suggestions": `${basePersona}${brandSection}\n\nTask: Review the email for accessibility improvements. Suggest clearer headings, shorter paragraphs, descriptive links, better alt-text drafts, reduced reliance on visual instructions, simpler language, and more meaningful button text.`,
    "tone_consistency": `${basePersona}${brandSection}\n\nTask: Check the provided email content for tone consistency with the brand guidelines. Flag inconsistencies and suggest alternatives.`,
    "content_variation": `${basePersona}${brandSection}\n\nTask: Create a controlled A/B variation of the provided content while preserving required links, merge tags, brand content, and legal content. Clearly label what changed.`,
    "content_adaptation": `${basePersona}${brandSection}\n\nTask: Adapt the provided content for a different brand/product while preserving factual meaning. Change tone, product name, support details, and visual defaults only as provided by the target brand. Never replace legal identity or support details with invented values.`,
    "plain_text": `${basePersona}${brandSection}\n\nTask: Convert the provided HTML email content into a clean plain-text version. Preserve links as URLs in brackets. Maintain logical structure with clear section breaks.`,
    "simplify_language": `${basePersona}${brandSection}\n\nTask: Simplify the language in the provided text. Use shorter sentences and clearer words while preserving the meaning.`,
    "make_professional": `${basePersona}${brandSection}\n\nTask: Rewrite the provided text to be more professional.`,
    "make_friendlier": `${basePersona}${brandSection}\n\nTask: Rewrite the provided text to be friendlier and warmer.`,
    "shorten": `${basePersona}${brandSection}\n\nTask: Shorten the provided text while preserving core meaning.`,
    "expand": `${basePersona}${brandSection}\n\nTask: Expand the provided text with more detail while staying on topic.`,
  };
  return capabilityPrompts[capability] || `${basePersona}${brandSection}\n\nTask: ${capability}`;
}

function sanitizeContent(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/<embed[^>]*>/gi, "")
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, "");
}

function validateAIResponse(response: unknown, capability: string): { valid: boolean; result: unknown; warnings: string[] } {
  const warnings: string[] = [];
  if (!response) return { valid: false, result: null, warnings: ["Empty response from AI"] };
  const resp = response as Record<string, unknown>;
  if (capability === "subject_lines") {
    const subjects = resp.subject_options || resp.subjects;
    if (!subjects || !Array.isArray(subjects) || (subjects as unknown[]).length === 0) {
      return { valid: false, result: null, warnings: ["No valid subject options generated"] };
    }
  }
  if (capability === "draft_from_brief") {
    if (resp.sections && Array.isArray(resp.sections)) {
      resp.sections = (resp.sections as Array<Record<string, unknown>>).map(function (s) { return { ...s, paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs.map(function (p: unknown) { return typeof p === 'string' ? sanitizeContent(p) : p; }) : s.paragraphs }; });
    }
    if (resp.body && typeof resp.body === 'string') {
      resp.body = sanitizeContent(resp.body);
    }
  }
  const dangerous = /<script|<iframe|<form|<embed|<object|javascript\s*:/gi;
  const jsonStr = JSON.stringify(resp);
  if (dangerous.test(jsonStr)) {
    return { valid: false, result: null, warnings: ["Response contains unsafe content and was rejected"] };
  }
  return { valid: true, result: resp, warnings };
}

function buildContentForModel(capability: string, payload: Record<string, unknown>, systemPrompt: string): { messages: Array<{role: string; content: string}> } {
  const messages: Array<{role: string; content: string}> = [{ role: "system", content: systemPrompt }];
  switch (capability) {
    case "subject_lines":
      messages.push({ role: "user", content: `Generate ${payload.count || 5} subject line options for an email with the following context:\n\nPurpose: ${payload.purpose || "Not specified"}\nAudience: ${payload.audience || "Not specified"}\nCategory: ${payload.category || "marketing"}\nCurrent subject (for reference): ${payload.current_subject || "None"}\nBrand: ${payload.brand_name || "Not specified"}\n\nFor each option, provide: the subject line text, character count, tone, merge tags used (if any), and any potential issues. Format as JSON with subject_options array.` }); break;
    case "preview_text":
      messages.push({ role: "user", content: `Generate ${payload.count || 3} preview text options for this email.\n\nSubject: ${payload.subject || ""}\nCurrent preview: ${payload.current_preview || "None"}\nCategory: ${payload.category || "marketing"}\n\nFor each option, provide: the preview text, character count, and how it pairs with the subject. Format as JSON with preview_options array.` }); break;
    case "rewrite_text":
      messages.push({ role: "user", content: `Rewrite the following text: "${payload.text}"\n\nInstruction: ${payload.instruction || "improve clarity"}\nContext: ${payload.context || ""}\n\nProvide: the suggested version, a brief summary of key changes made. Format as JSON with suggested_text and changes_summary fields.` }); break;
    case "draft_from_brief":
      messages.push({ role: "user", content: `Create an email draft from this brief:\n\nPurpose: ${payload.purpose || ""}\nAudience: ${payload.audience || ""}\nBrand: ${payload.brand_name || ""}\nCategory: ${payload.category || "marketing"}\nDesired Action: ${payload.desired_action || ""}\nTone: ${payload.tone || "professional"}\nKey Information: ${payload.key_info || ""}\nRequired Links: ${payload.required_links || ""}\nMerge Tags: ${payload.merge_tags || ""}\nLength: ${payload.length || "medium"}\nRestrictions: ${payload.restrictions || ""}\n\nGenerate: subject_options (3-5), preview_text_options (2-3), outline (array of section headings), draft body with sections, primary CTA, and optional alternative version. Format as JSON.` }); break;
    case "cta_suggestions":
      messages.push({ role: "user", content: `Generate call-to-action button label and supporting copy options.\n\nContext: ${payload.context || ""}\nCurrent CTA: ${payload.current_cta || "None"}\nDesired action: ${payload.desired_action || ""}\n\nProvide 3-5 options. For each: button label, supporting line, and a note about effectiveness. Format as JSON with cta_options array.` }); break;
    case "content_review":
      messages.push({ role: "user", content: `Review the following email content and return improvement suggestions:\n\nSubject: ${payload.subject || ""}\nPreview: ${payload.preview_text || ""}\nContent: ${payload.content || ""}\n\nCheck for: clarity, tone consistency, repetition, long paragraphs, weak CTAs, missing context, reading difficulty, accessibility issues, image alt text gaps, link wording, subject/body consistency, unsupported claims, mobile readability, missing plain-text content.\n\nFormat as JSON with suggestions array, each having type, severity, title, description, and block_reference (if applicable).` }); break;
    case "accessibility_suggestions":
      messages.push({ role: "user", content: `Review this email content for accessibility improvements:\n\n${payload.content || ""}\n\nSuggest: clearer headings, shorter paragraphs, descriptive links, better alt-text, reduced visual instructions, simpler language, meaningful button text. Format as JSON with suggestions array.` }); break;
    case "tone_consistency":
      messages.push({ role: "user", content: `Check this email content for tone consistency with brand guidelines.\n\nContent: ${payload.content || ""}\nExpected tone: ${payload.expected_tone || "professional"}\n\nFlag inconsistencies and suggest alternatives. Format as JSON with issues array.` }); break;
    case "content_variation":
      messages.push({ role: "user", content: `Create a controlled A/B variation:\n\nElement to vary: ${payload.element || ""}\nOriginal: ${payload.original || ""}\nContext: ${payload.context || ""}\n\nPreserve: links, merge tags, brand and legal content. Label what changed. Format as JSON.` }); break;
    case "content_adaptation":
      messages.push({ role: "user", content: `Adapt this content for a different brand/product:\n\nContent: ${payload.content || ""}\nSource brand: ${payload.source_brand || ""}\nTarget brand: ${payload.target_brand || ""}\nTarget product: ${payload.target_product || ""}\nTarget tone: ${payload.target_tone || ""}\n\nPreserve factual meaning. Only change brand-specific elements. Format as JSON.` }); break;
    case "plain_text":
      messages.push({ role: "user", content: `Convert this HTML email content to a clean plain-text version:\n\n${payload.content || ""}\n\nPreserve links as URLs in brackets. Maintain logical structure with clear section breaks. Format as JSON with plain_text field.` }); break;
    default:
      messages.push({ role: "user", content: `${capability.replace(/_/g, " ")} this text:\n\n"${payload.text || ""}"\n\nContext: ${payload.context || ""}\n\nProvide the improved version. Format as JSON with suggested_text field.` }); break;
  }
  return { messages };
}

serve(async (req: Request) => {
  const { headers: corsH, originAllowed } = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed) return new Response(null, { status: 204 });
    return new Response("ok", { headers: corsH });
  }

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: corsH });
  }

  try {
    const body: AIRequest = await req.json();
    const { capability, payload, organisation_id, campaign_id, brand_id } = body;

    if (!capability) {
      return new Response(JSON.stringify({ error: "capability is required" }), { status: 400, headers: corsH });
    }

    const maxInputSize = 50000;
    if (JSON.stringify(payload || {}).length > maxInputSize) {
      return new Response(JSON.stringify({ error: "input_too_large" }), { status: 400, headers: corsH });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const aiApiKey = Deno.env.get("AI_PROVIDER_API_KEY");
    if (!aiApiKey) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
    }

    const modelConfig: AIModelConfig = {
      provider: Deno.env.get("AI_PROVIDER") || "openai",
      model: Deno.env.get("AI_MODEL") || "gpt-4o-mini",
      api_key: aiApiKey,
      base_url: Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1",
      max_input_tokens: parseInt(Deno.env.get("AI_MAX_INPUT_TOKENS") || "8000"),
      max_output_tokens: parseInt(Deno.env.get("AI_MAX_OUTPUT_TOKENS") || "4000"),
      temperature: parseFloat(Deno.env.get("AI_TEMPERATURE") || "0.7"),
      request_timeout_ms: parseInt(Deno.env.get("AI_TIMEOUT_MS") || "30000"),
    };

    const orgOverride = payload.organisation_id as string | undefined;
    if (orgOverride || organisation_id) {
      const { data: settings } = await supabase.from("email_studio_settings").select("ai_config").maybeSingle();
      if (settings?.ai_config && typeof settings.ai_config === "object") {
        const aiConfig = settings.ai_config as Record<string, unknown>;
        if (aiConfig.ai_enabled === false) {
          return new Response(JSON.stringify({ error: "AI assistant is disabled for this organisation" }), { status: 403, headers: corsH });
        }
      }
    }

    let brandContext: Record<string, unknown> | null = null;
    const brandId = payload.brand_id || brand_id;
    if (brandId) {
      const { data: brand } = await supabase.from("email_brand_kits").select("name, product_name, description, ai_voice_settings").eq("id", brandId).maybeSingle();
      if (brand) {
        brandContext = { name: brand.name, product_name: brand.product_name, positioning: brand.description };
        if (brand.ai_voice_settings && typeof brand.ai_voice_settings === "object") {
          const voice = brand.ai_voice_settings as Record<string, unknown>;
          brandContext.tone = voice.tone_descriptors || voice.tone;
          brandContext.preferred_terms = voice.preferred_terms;
          brandContext.restricted_phrases = voice.restricted_phrases;
        }
      }
    }

    const systemPrompt = buildSystemPrompt(capability, brandContext);
    const { messages } = buildContentForModel(capability, payload, systemPrompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, modelConfig.request_timeout_ms);

    let aiResponse: Response;
    try {
      aiResponse = await fetch(`${modelConfig.base_url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${modelConfig.api_key}` },
        body: JSON.stringify({ model: modelConfig.model, messages, temperature: modelConfig.temperature, max_tokens: modelConfig.max_output_tokens, response_format: { type: "json_object" } }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      return new Response(JSON.stringify({ error: isTimeout ? "ai_request_timeout" : "ai_provider_unavailable" }), { status: isTimeout ? 504 : 502, headers: corsH });
    }
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      let errMsg = "ai_provider_error";
      if (aiResponse.status === 429) errMsg = "rate_limited";
      return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: corsH });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) {
      return new Response(JSON.stringify({ error: "ai_no_content" }), { status: 502, headers: corsH });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(aiContent); } catch { parsed = { raw_response: aiContent }; }

    const validation = validateAIResponse(parsed, capability);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.warnings.join(". ") }), { status: 422, headers: corsH });
    }

    const inputUnits = aiData.usage?.prompt_tokens || 0;
    const outputUnits = aiData.usage?.completion_tokens || 0;
    const costPerInput = modelConfig.model.includes("gpt-4") ? 0.000003 : 0.00000015;
    const costPerOutput = modelConfig.model.includes("gpt-4") ? 0.000006 : 0.0000006;
    const estimatedCost = (inputUnits * costPerInput) + (outputUnits * costPerOutput);

    try {
      await supabase.from("email_ai_usage_logs").insert({
        organisation_id: orgOverride || organisation_id || null,
        user_id: payload.user_id || null,
        action_type: capability,
        template_id: payload.template_id || null,
        campaign_id: campaign_id || payload.campaign_id || null,
        brand_id: brandId || null,
        model_used: modelConfig.model,
        input_units: inputUnits,
        output_units: outputUnits,
        estimated_cost: estimatedCost,
        success: true,
        content_applied: false,
        request_summary: `${capability} generated successfully`,
      });
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ success: true, capability, result: validation.result, usage: { input_units: inputUnits, output_units: outputUnits, estimated_cost: estimatedCost }, warnings: validation.warnings }), { headers: corsH });

  } catch (_err) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
  }
});
