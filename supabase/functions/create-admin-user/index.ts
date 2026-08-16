import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ALLOWED_ORIGIN = Deno.env.get("DFP_ADMIN_ORIGIN") || "https://digital-footprint.uk";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin === ALLOWED_ORIGIN ||
    (Deno.env.get("DFP_DEV_ORIGIN") && origin === Deno.env.get("DFP_DEV_ORIGIN"));
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed ? (origin || ALLOWED_ORIGIN) : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    const callerId = authUser.user.id;

    const { data: callerProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("role, active")
      .eq("id", callerId)
      .eq("active", true)
      .maybeSingle();

    if (!callerProfile || !["owner", "super_admin"].includes(callerProfile.role)) {
      await supabaseAdmin.from("admin_security_audit_log").insert({
        actor_id: callerId,
        action: "unsafe_admin_endpoint_rejected",
        target_user_id: callerId,
        success: false,
        details: { reason: "insufficient_privileges", endpoint: "create-admin-user" },
        created_at: new Date().toISOString(),
        module: "admin-repair-2",
        source: "edge_function",
      });

      return new Response(JSON.stringify({ error: "Only owners and super administrators can create admin accounts" }), {
        status: 403,
        headers: corsHeaders(origin),
      });
    }

    const body = await req.json();
    const { email, password, role, full_name } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password are required" }), {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    const VALID_ROLES = ["owner", "super_admin", "admin", "department_head", "team_lead", "manager", "staff", "contractor", "auditor"];
    const assignedRole = (typeof role === "string" && VALID_ROLES.includes(role)) ? role : "admin";

    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: "Failed to check existing users" }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }

    const alreadyExists = existingUsers.users.find((u: any) => u.email === email);
    if (alreadyExists) {
      const { data: existingProfile } = await supabaseAdmin
        .from("admin_profiles")
        .select("id")
        .eq("id", alreadyExists.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin.from("admin_profiles").insert({
          id: alreadyExists.id,
          email: email,
          full_name: full_name || null,
          role: assignedRole,
          active: true,
          created_by: callerId,
        });
      }

      await supabaseAdmin.from("admin_security_audit_log").insert({
        actor_id: callerId,
        action: "admin_profile_created",
        target_user_id: alreadyExists.id,
        target_email: email,
        success: true,
        details: { role: assignedRole, already_existed: true },
        created_at: new Date().toISOString(),
        module: "admin-repair-2",
        source: "edge_function",
      });

      return new Response(JSON.stringify({
        message: "User already exists. Profile ensured.",
        user_id: alreadyExists.id,
      }), { status: 200, headers: corsHeaders(origin) });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }

    await supabaseAdmin.from("admin_profiles").insert({
      id: newUser.user.id,
      email: email,
      full_name: full_name || null,
      role: assignedRole,
      active: true,
      created_by: callerId,
    });

    await supabaseAdmin.from("admin_security_audit_log").insert({
      actor_id: callerId,
      action: "admin_profile_created",
      target_user_id: newUser.user.id,
      target_email: email,
      success: true,
      details: { role: assignedRole },
      created_at: new Date().toISOString(),
      module: "admin-repair-2",
      source: "edge_function",
    });

    return new Response(JSON.stringify({
      message: "Admin user created",
      user_id: newUser.user.id,
    }), { status: 200, headers: corsHeaders(origin) });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
