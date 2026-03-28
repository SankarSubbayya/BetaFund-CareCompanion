import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY'),
  });

  const url = new URL(req.url);
  const specialty = url.searchParams.get('specialty');
  const source = url.searchParams.get('source');
  const search = url.searchParams.get('search');

  let query = client.database
    .from('providers')
    .select()
    .order('rating', { ascending: false });

  if (specialty) query = query.eq('specialty', specialty);
  if (source) query = query.eq('source', source);
  if (search) query = query.or(`name.ilike.%${search}%,clinic_name.ilike.%${search}%,city.ilike.%${search}%,specialty.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 400);
  return json(data);
}
