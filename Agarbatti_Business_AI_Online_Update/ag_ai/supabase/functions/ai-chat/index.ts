import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { message, businessData } = await req.json();
    if (!message) throw new Error("Message is required");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in Supabase secrets.");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";

    const safeData = Array.isArray(businessData) ? businessData.slice(-90) : [];
    const instructions = `You are the AI business assistant for an Agarbatti (incense-stick) business in India.
Answer the owner's questions using the supplied dashboard data. Be practical, concise, and clear.
You can speak English, Hindi, or Bengali; reply in the language the owner uses.
Do not invent numbers. If data is missing, say so.
You may analyze sales, profit, expenses, production, stock, receivables, payables, damaged units, and products.
For commands that would change data, explain what should be changed, but do not claim that you changed database records unless the app confirms the action.
Currency is Indian rupees (₹). Dates are YYYY-MM-DD.

Dashboard data (latest records):
${JSON.stringify(safeData)}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions,
        input: message,
        max_output_tokens: 700,
      }),
    });

    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || "OpenAI request failed");

    return new Response(JSON.stringify({ reply: body.output_text || extractText(body) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
