import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Authentication required.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Supabase environment is not configured.");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in Supabase secrets.");

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Invalid or expired session.");

    const { data: rows, error: dataError } = await supabase
      .from("daily_entries")
      .select("date,sales,orders,units,production,raw,raw_cost,pack,labour,other,expenses,profit,stock,recv,pay,damaged,product")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(90);
    if (dataError) throw new Error("Could not load your business data.");

    const { message } = await req.json();
    if (!message) throw new Error("Message is required.");

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
    const instructions = `You are the AI business assistant for an Agarbatti business in India.
Use only the supplied business records. Do not invent numbers.
Reply in the language used by the owner (English, Hindi, or Bengali).
Be concise and practical. Analyze sales, profit, expenses, production, stock, receivables, payables, damaged units, and products.
You may suggest actions, but do not claim that you changed records.
Currency is Indian rupees (₹). Dates are YYYY-MM-DD.

Latest business records:
${JSON.stringify((rows || []).reverse())}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, instructions, input: message, max_output_tokens: 700 }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || "OpenAI request failed");

    return new Response(JSON.stringify({ reply: body.output_text || extractText(body) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractText(body: any): string {
  const parts: string[] = [];
  for (const item of body?.output || []) {
    for (const c of item?.content || []) {
      if (c?.type === "output_text" && c?.text) parts.push(c.text);
    }
  }
  return parts.join("\n") || "I could not generate a response.";
}