import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const BLAND_API_BASE = 'https://api.bland.ai/v1';

function buildCheckinPrompt(senior: any): string {
  const meds = (senior.medications || []).join(', ') || 'no specific medications listed';
  const name = senior.name || 'there';

  return `You are CareCompanion, a warm and friendly AI care assistant calling ${name} for their daily check-in.

Your personality: You are patient, kind, and genuinely caring. Speak clearly and at a moderate pace. Use simple language.

Follow this conversation flow:

1. GREETING: "Hi ${name}, this is CareCompanion calling for your daily check-in. How are you feeling today?"
   - Listen carefully to their response. Note any mentions of pain, discomfort, or distress.

2. MEDICATION CHECK: "Have you taken your medications today? You should have taken: ${meds}."
   - If they say yes, acknowledge positively.
   - If they say no or ran out, ask: "Would you like me to notify your family to help get your medications?"

3. WELLNESS CHECK: "Is there anything you need help with today? Any concerns or anything on your mind?"
   - Listen for mentions of: falls, dizziness, pain, loneliness, confusion, difficulty with daily tasks.

4. SERVICE NEEDS: If they mention needing help, reassure them: "I'll make sure your family knows about this so they can help."

5. CLOSING: "Thank you for chatting with me, ${name}. Take care and I'll call you again tomorrow."

IMPORTANT SAFETY RULES:
- If the senior mentions a fall, injury, chest pain, or any emergency, say: "That sounds serious. I'm going to make sure your family is notified right away. If this is an emergency, please hang up and call 911."
- If they sound confused or disoriented, note it clearly.
- If they express loneliness or sadness, be empathetic.
- Always be respectful and never rush the conversation.

${senior.notes ? `Additional notes about ${name}: ${senior.notes}` : ''}`;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const BLAND_AI_KEY = Deno.env.get('BLAND_AI_API_KEY');
  if (!BLAND_AI_KEY) {
    return json({ error: 'Bland AI API key not configured' }, 500);
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY'),
  });

  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');

  let seniorPhone = phone;
  if (!seniorPhone) {
    try {
      const body = await req.json();
      seniorPhone = body.senior_phone || body.phone;
    } catch {}
  }

  if (!seniorPhone) {
    return json({ error: 'phone parameter required' }, 400);
  }

  // Look up senior
  const { data: senior, error: seniorError } = await client.database
    .from('seniors')
    .select()
    .eq('phone', seniorPhone)
    .maybeSingle();

  if (seniorError || !senior) {
    return json({ error: 'Senior not found' }, 404);
  }

  // Build prompt and call Bland AI
  const prompt = buildCheckinPrompt(senior);
  const BASE_URL = Deno.env.get('BASE_URL') || '';
  const webhookUrl = BASE_URL ? `${BASE_URL}/api/webhooks/bland/call-complete` : '';

  const payload: any = {
    phone_number: seniorPhone,
    task: prompt,
    voice: 'mason',
    max_duration: 5,
    record: true,
    answered_by_enabled: true,
    wait_for_greeting: true,
    ring_timeout: 60,
    voicemail_action: 'leave_message',
    voicemail_message: `Hi ${senior.name}, this is CareCompanion calling for your daily check-in. We'll try again later. Take care!`,
  };

  if (webhookUrl) {
    payload.webhook = webhookUrl;
  }

  try {
    const resp = await fetch(`${BLAND_API_BASE}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': BLAND_AI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return json({ error: 'Bland AI error', detail: data, status: resp.status }, 400);
    }

    const callId = data.call_id || '';
    return json({
      status: 'call_initiated',
      call_id: callId,
      senior: senior.name,
      senior_phone: seniorPhone,
    });
  } catch (e: any) {
    return json({ error: 'Failed to call Bland AI', detail: e.message }, 500);
  }
}
