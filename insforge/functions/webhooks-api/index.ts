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

// Simple keyword-based transcript analysis
function analyzeTranscript(transcript: string) {
  const lower = transcript.toLowerCase();

  // Mood detection
  const happyWords = ['good', 'great', 'wonderful', 'fine', 'happy', 'well', 'better', 'fantastic'];
  const sadWords = ['sad', 'lonely', 'depressed', 'tired', 'awful', 'terrible', 'miss'];
  const concerningWords = ['fell', 'fall', 'pain', 'hurt', 'chest', 'dizzy', 'bleeding', 'emergency', 'help'];

  let mood = 'neutral';
  let wellness_score = 5;
  if (concerningWords.some(w => lower.includes(w))) { mood = 'concerning'; wellness_score = 2; }
  else if (sadWords.some(w => lower.includes(w))) { mood = 'sad'; wellness_score = 4; }
  else if (happyWords.some(w => lower.includes(w))) { mood = 'happy'; wellness_score = 8; }

  // Medication
  const medTaken = lower.includes('took') || lower.includes('taken') || lower.includes('yes') && lower.includes('pill');
  const medMissed = lower.includes('forgot') || lower.includes('missed') || lower.includes("didn't take");
  const medication_taken = medMissed ? false : medTaken ? true : null;

  // Concerns
  const concerns: string[] = [];
  if (lower.includes('fell') || lower.includes('fall')) concerns.push('fall');
  if (lower.includes('pain') || lower.includes('hurt')) concerns.push('pain');
  if (lower.includes('chest')) concerns.push('chest_pain');
  if (lower.includes('lonely') || lower.includes('alone')) concerns.push('loneliness');
  if (lower.includes('dizzy')) concerns.push('dizziness');
  if (lower.includes('bleeding')) concerns.push('bleeding');

  // Service requests
  const service_requests: Array<{ type: string; label: string }> = [];
  if (lower.includes('shower') || lower.includes('bath')) service_requests.push({ type: 'shower_help', label: 'Bathing assistance' });
  if (lower.includes('medicine') || lower.includes('prescription') || lower.includes('refill')) service_requests.push({ type: 'medicine_need', label: 'Medicine/prescription' });
  if (lower.includes('hungry') || lower.includes('food') || lower.includes("can't cook") || lower.includes('grocery')) service_requests.push({ type: 'grocery_help', label: 'Food/meal assistance' });
  if (lower.includes('mail') || lower.includes('package')) service_requests.push({ type: 'mail_help', label: 'Mail assistance' });
  if (lower.includes('ride') || lower.includes('transport') || lower.includes('doctor')) service_requests.push({ type: 'transportation', label: 'Transportation' });
  if (concerningWords.some(w => lower.includes(w))) service_requests.push({ type: 'emergency', label: 'Emergency services' });
  if (lower.includes('lonely') || lower.includes('no one visit')) service_requests.push({ type: 'companionship', label: 'Companionship' });

  const summary = `Mood: ${mood}, Wellness: ${wellness_score}/10. ${concerns.length ? 'Concerns: ' + concerns.join(', ') + '.' : 'No concerns.'} ${service_requests.length ? 'Services needed: ' + service_requests.map(s => s.label).join(', ') + '.' : ''}`;

  return { mood, wellness_score, medication_taken, concerns, service_requests, summary };
}

// Generate alerts from analysis
function generateAlerts(analysis: ReturnType<typeof analyzeTranscript>, seniorPhone: string, seniorName: string) {
  const alerts: Array<{ senior_phone: string; senior_name: string; alert_type: string; severity: string; message: string }> = [];
  const lower = analysis.concerns.join(' ');

  // Emergency alerts
  const emergencyKeywords = ['fall', 'chest_pain', 'bleeding'];
  if (analysis.concerns.some(c => emergencyKeywords.includes(c))) {
    alerts.push({
      senior_phone: seniorPhone,
      senior_name: seniorName,
      alert_type: 'emergency',
      severity: 'critical',
      message: `Emergency detected during check-in: ${analysis.concerns.join(', ')}. Immediate attention needed for ${seniorName}.`,
    });
  }

  // Mood alerts
  if (analysis.mood === 'concerning' || analysis.wellness_score <= 3) {
    alerts.push({
      senior_phone: seniorPhone,
      senior_name: seniorName,
      alert_type: 'low_mood',
      severity: 'high',
      message: `${seniorName} reported concerning mood (wellness: ${analysis.wellness_score}/10).`,
    });
  }

  // Medication alerts
  if (analysis.medication_taken === false) {
    alerts.push({
      senior_phone: seniorPhone,
      senior_name: seniorName,
      alert_type: 'missed_medication',
      severity: 'medium',
      message: `${seniorName} may have missed medications.`,
    });
  }

  // Loneliness alerts
  if (analysis.concerns.includes('loneliness')) {
    alerts.push({
      senior_phone: seniorPhone,
      senior_name: seniorName,
      alert_type: 'loneliness',
      severity: 'medium',
      message: `${seniorName} expressed feelings of loneliness.`,
    });
  }

  return alerts;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY'),
  });

  const body = await req.json();
  const transcript = body.transcript || body.concatenated_transcript || '';
  const callId = body.call_id || '';
  const seniorPhone = body.to || body.senior_phone || '';

  if (!seniorPhone || !transcript) {
    return json({ error: 'Missing senior_phone/to and transcript' }, 400);
  }

  // Look up senior
  const { data: senior } = await client.database
    .from('seniors')
    .select()
    .eq('phone', seniorPhone)
    .maybeSingle();

  const seniorName = senior?.name || seniorPhone;

  // Analyze transcript
  const analysis = analyzeTranscript(transcript);

  // Store checkin
  await client.database.from('checkins').insert([{
    senior_phone: seniorPhone,
    call_id: callId,
    transcript,
    mood: analysis.mood,
    wellness_score: analysis.wellness_score,
    medication_taken: analysis.medication_taken,
    concerns: analysis.concerns,
    service_requests: analysis.service_requests,
    summary: analysis.summary,
  }]);

  // Generate and store alerts
  const alerts = generateAlerts(analysis, seniorPhone, seniorName);
  if (alerts.length > 0) {
    await client.database.from('alerts').insert(alerts);
  }

  return json({
    status: 'processed',
    senior: seniorName,
    call_id: callId,
    mood: analysis.mood,
    wellness_score: analysis.wellness_score,
    alerts: alerts.length,
    service_requests: analysis.service_requests.length,
  });
}
