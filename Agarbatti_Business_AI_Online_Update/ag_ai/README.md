# Agarbatti Business AI Dashboard — Cloud + AI Chat

This version adds a real natural-language AI assistant to the dashboard.

## What it can do
- Read your recent business dashboard data and answer questions in English, Hindi, or Bengali.
- Analyze sales, profit, expenses, production, stock, receivables, payables, damaged units, and products.
- Understand natural-language questions such as:
  - "How was my business this week?"
  - "Why did profit fall?"
  - "How much stock should I make?"
  - "Show me the biggest expense."
  - "আজকের বিক্রি কত?"
- Existing local commands can still update today's sale/stock and open dashboard/entry pages.

## Important security rule
NEVER put an OpenAI API key in `index.html` or `config.js`. The API key belongs in Supabase Edge Function secrets.

## Setup
1. Keep your Supabase project and `daily_entries` table.
2. Deploy `supabase/functions/ai-chat/index.ts` as a Supabase Edge Function named `ai-chat`.
3. In Supabase Edge Function Secrets, add:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `OPENAI_MODEL` = `gpt-5.6-luna` (optional; this is the default in the function)
4. Put your Supabase URL and anon/public key in `config.js`.
5. Host the website files online.
6. Open the dashboard and tap **🤖 Ask AI**.

The OpenAI API is billed separately from Supabase. Keep the API key server-side in the Edge Function secret; do not expose it in the browser.

## Files
- `index.html` — dashboard + AI chat UI
- `config.js` — Supabase URL/key only
- `supabase_schema.sql` — database table
- `supabase/functions/ai-chat/index.ts` — secure AI backend
