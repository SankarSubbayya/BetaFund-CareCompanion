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

const EVERMIND_BASE = 'http://localhost:1995/api/v1';

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'store';

  // POST — store memory
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const resp = await fetch(`${EVERMIND_BASE}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: body.call_id || `mem_${body.senior_phone}_${Date.now()}`,
          create_time: new Date().toISOString(),
          sender: body.senior_phone,
          content: body.content,
        }),
      });
      if (resp.status === 200 || resp.status === 202) {
        return json({ status: 'stored', senior_phone: body.senior_phone });
      }
      return json({ status: 'failed', detail: await resp.text() }, 400);
    } catch (e) {
      return json({ status: 'failed', detail: 'EverMind not available' }, 503);
    }
  }

  // GET — search or get memories
  if (req.method === 'GET') {
    const seniorPhone = url.searchParams.get('senior_phone') || url.searchParams.get('user_id') || '';
    const query = url.searchParams.get('query') || 'previous concerns and health';

    try {
      const resp = await fetch(`${EVERMIND_BASE}/memories/search`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          user_id: seniorPhone,
          memory_types: ['episodic_memory'],
          retrieve_method: 'hybrid',
        }),
      });
      if (resp.status !== 200) {
        return json({ memories: [], count: 0 });
      }
      const data = await resp.json();
      const memories = (data.result?.memories || []).map((m: any) =>
        typeof m === 'string' ? m : m.content || JSON.stringify(m)
      );
      return json({ senior_phone: seniorPhone, memories, count: memories.length });
    } catch (e) {
      return json({ memories: [], count: 0 });
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
