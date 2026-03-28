import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  // GET /seniors-api — list all or get one by phone
  if (req.method === 'GET') {
    if (phone) {
      const { data, error } = await client.database
        .from('seniors')
        .select()
        .eq('phone', phone)
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: 'Senior not found' }, 404);
      return json(data);
    }
    const { data, error } = await client.database.from('seniors').select();
    if (error) return json({ error: error.message }, 400);
    return json(data);
  }

  // POST /seniors-api — create a senior
  if (req.method === 'POST') {
    const body = await req.json();
    // Check duplicate
    const { data: existing } = await client.database
      .from('seniors')
      .select('phone')
      .eq('phone', body.phone)
      .maybeSingle();
    if (existing) return json({ error: 'Senior already exists' }, 409);

    const { data, error } = await client.database
      .from('seniors')
      .insert([{
        phone: body.phone,
        name: body.name,
        role: body.role || 'patient',
        patient_type: body.patient_type || 'senior',
        medications: body.medications || [],
        emergency_contacts: body.emergency_contacts || [],
        caregivers: body.caregivers || [],
        checkin_schedule: body.checkin_schedule || '09:00',
        notes: body.notes || '',
      }])
      .select();
    if (error) return json({ error: error.message }, 400);
    return json(data[0], 201);
  }

  // PUT /seniors-api?phone=... — update a senior
  if (req.method === 'PUT') {
    if (!phone) return json({ error: 'phone parameter required' }, 400);
    const body = await req.json();
    const { data, error } = await client.database
      .from('seniors')
      .update(body)
      .eq('phone', phone)
      .select();
    if (error) return json({ error: error.message }, 400);
    if (!data || data.length === 0) return json({ error: 'Senior not found' }, 404);
    return json(data[0]);
  }

  // DELETE /seniors-api?phone=... — delete a senior
  if (req.method === 'DELETE') {
    if (!phone) return json({ error: 'phone parameter required' }, 400);
    const { error } = await client.database
      .from('seniors')
      .delete()
      .eq('phone', phone);
    if (error) return json({ error: error.message }, 400);
    return json({ status: 'deleted', phone });
  }

  return json({ error: 'Method not allowed' }, 405);
}
