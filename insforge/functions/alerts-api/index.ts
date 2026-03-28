import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
  const severity = url.searchParams.get('severity');
  const alertId = url.searchParams.get('id');

  // GET — list alerts
  if (req.method === 'GET') {
    let query = client.database
      .from('alerts')
      .select()
      .order('created_at', { ascending: false });
    if (phone) query = query.eq('senior_phone', phone);
    if (severity) query = query.eq('severity', severity);
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json(data);
  }

  // POST — create an alert
  if (req.method === 'POST') {
    const body = await req.json();
    const { data, error } = await client.database
      .from('alerts')
      .insert([{
        senior_phone: body.senior_phone,
        senior_name: body.senior_name || '',
        alert_type: body.alert_type,
        severity: body.severity,
        message: body.message,
        acknowledged: false,
      }])
      .select();
    if (error) return json({ error: error.message }, 400);
    return json(data[0], 201);
  }

  // PUT — acknowledge an alert
  if (req.method === 'PUT') {
    if (!alertId) return json({ error: 'id parameter required' }, 400);
    const { data, error } = await client.database
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId)
      .select();
    if (error) return json({ error: error.message }, 400);
    if (!data || data.length === 0) return json({ error: 'Alert not found' }, 404);
    return json(data[0]);
  }

  return json({ error: 'Method not allowed' }, 405);
}
