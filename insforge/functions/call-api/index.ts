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

function buildCheckinPrompt(senior: any, doctors: any[]): string {
  const meds = (senior.medications || []).join(', ') || 'no specific medications listed';
  const name = senior.name || 'there';

  // Build doctor directory for the prompt
  let doctorDirectory = '';
  if (doctors.length > 0) {
    const bySpecialty: Record<string, any[]> = {};
    for (const doc of doctors) {
      const spec = doc.specialty || 'General';
      if (!bySpecialty[spec]) bySpecialty[spec] = [];
      if (bySpecialty[spec].length < 3) {
        bySpecialty[spec].push(doc);
      }
    }
    const entries = Object.entries(bySpecialty).map(([spec, docs]) => {
      const list = docs.map((d: any) =>
        `  - Dr. ${d.name} (Rating: ${d.rating}/5) at ${d.clinic_name || 'N/A'}, ${d.city || ''} ${d.state || ''} — Phone: ${d.phone}`
      ).join('\n');
      return `${spec}:\n${list}`;
    }).join('\n\n');
    doctorDirectory = `\n\nDOCTOR DIRECTORY — Use this to recommend real doctors:\n${entries}`;
  }

  // Build emergency contacts context
  const emergencyContacts = (senior.emergency_contacts || []);
  let emergencyInfo = '';
  if (emergencyContacts.length > 0) {
    const contacts = emergencyContacts.map((c: any) => `${c.name} (${c.relation}) — ${c.phone}`).join(', ');
    emergencyInfo = `\nEmergency contacts: ${contacts}`;
  }

  return `You are CareCompanion, a warm and friendly AI care assistant calling ${name} for their daily check-in.

PATIENT PROFILE — Use this context throughout the call:
- Name: ${name}
- Current medications: ${meds}
- Patient type: ${senior.patient_type || 'senior'}${emergencyInfo}
${senior.notes ? `- Notes: ${senior.notes}` : ''}

Your personality: You are patient, kind, and genuinely caring. Speak clearly and at a moderate pace. Use simple language. You are knowledgeable about the patient's medications and health context.

Follow this conversation flow:

1. GREETING: "Hi ${name}, this is CareCompanion calling for your daily check-in. How are you feeling today?"
   - Listen carefully to their response. Note any mentions of pain, discomfort, or distress.

2. MEDICATION CHECK: "Have you taken your medications today? You should have taken: ${meds}."
   - If they say yes, acknowledge positively.
   - If they say no or ran out, offer to help: "I can recommend a nearby doctor or pharmacy to help with that."
   - If they mention side effects from a medication, use your knowledge of their medication list to provide context. For example: "I see you're taking ${meds}. Some of those can cause side effects like dizziness or nausea. I'd recommend speaking with a doctor about adjusting your dosage."
   - If they ask about drug interactions or concerns about their medications, reference their specific medication list and recommend they consult a doctor for changes.

3. WELLNESS CHECK: "Is there anything you need help with today? Any concerns or anything on your mind?"
   - Listen for mentions of: falls, dizziness, pain, loneliness, confusion, skin issues, difficulty with daily tasks.

4. DOCTOR RECOMMENDATIONS & APPOINTMENTS: This is CRITICAL — when the patient mentions any health concern:
   - Consider their current medications (${meds}) when recommending a doctor — the doctor should be relevant to their condition and medications.
   - Look up a relevant doctor from the DOCTOR DIRECTORY below.
   - Recommend a SPECIFIC doctor by name, specialty, location, and phone number.
   - Example: "Based on what you're describing, and considering you're currently taking ${(senior.medications || [])[0] || 'your medications'}, I'd recommend Dr. Jack Ackerman, an internal medicine doctor in San Jose. His office is at Stanford Medicine Partners and you can reach them at (408) 371-9010. Would you like me to help schedule an appointment?"
   - For skin issues, recommend a dermatologist from the directory.
   - For general health or medication concerns, recommend an internal medicine or family medicine doctor.
   - Always ask: "Would you like me to schedule an appointment for you? What day and time works best?"
   - If they give a preferred time, confirm: "Great, I'll schedule you with Dr. [name] on [day] at [time]. Their office will confirm with you at [phone number]."
   - If they ask "what kind of doctor should I see?" — use their medications and symptoms to guide them. For example, if they take heart medication, suggest a cardiologist or internist.

5. SERVICE NEEDS: For non-medical needs (groceries, transportation, bathing help):
   - Shower/bathing: "I can connect you with Home Instead Senior Care at (415) 411-6490 or Visiting Angels at (415) 433-6800 for personal care assistance."
   - Food/meals: "Meals on Wheels SF delivers meals to your door. Their number is (415) 920-1111."
   - Transportation: "GoGoGrandparent can arrange rides for you at (855) 464-6872."
   - Medicine refill: "Alto Pharmacy offers free same-day delivery in SF at (415) 570-5873. I can see you need refills for ${meds}."

6. CLOSING: "Thank you for chatting with me, ${name}. Take care and I'll call you again tomorrow. If you need anything before then, don't hesitate to call."

IMPORTANT RULES:
- NEVER just say "I'll let the family know." Instead, ALWAYS provide a specific doctor recommendation, phone number, or service provider.
- You know this patient's medications (${meds}). Use this knowledge to provide informed, personalized recommendations. When recommending a doctor, mention how it relates to their current treatment.
- If the patient has a health concern, recommend a REAL doctor from the directory with their name, location, and phone number.
- If the patient wants an appointment, confirm the doctor, date, and time.
- If the senior mentions a fall, injury, chest pain, or any emergency: "That sounds serious. Please call 911 immediately if this is an emergency. I'm also going to recommend you see Dr. [name] as soon as possible at [phone]."
- If they sound confused or disoriented, note it clearly and recommend a doctor visit.
- If they express loneliness or sadness, be empathetic and suggest the Institute on Aging Friendship Line at (800) 971-0016.
- Always be respectful and never rush the conversation.
${doctorDirectory}`;
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

  // Fetch doctors from providers table for recommendations
  const { data: doctors } = await client.database
    .from('providers')
    .select()
    .order('rating', { ascending: false })
    .limit(10);

  // Build prompt with real doctor data
  const prompt = buildCheckinPrompt(senior, doctors || []);
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
