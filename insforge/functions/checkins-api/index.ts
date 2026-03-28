import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY'),
  });

  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');

  // GET — list checkins, optionally filtered by phone
  if (req.method === 'GET') {
    let query = client.database
      .from('checkins')
      .select()
      .order('created_at', { ascending: false });
    if (phone) query = query.eq('senior_phone', phone);
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json(data);
  }

  // POST — store a checkin result
  if (req.method === 'POST') {
    const body = await req.json();
    const { data, error } = await client.database
      .from('checkins')
      .insert([{
        senior_phone: body.senior_phone,
        call_id: body.call_id || '',
        transcript: body.transcript || '',
        mood: body.mood || '',
        wellness_score: body.wellness_score || 0,
        medication_taken: body.medication_taken,
        concerns: body.concerns || [],
        service_requests: body.service_requests || [],
        summary: body.summary || '',
      }])
      .select();
    if (error) return json({ error: error.message }, 400);
    return json(data[0], 201);
  }

  return json({ error: 'Method not allowed' }, 405);
}
