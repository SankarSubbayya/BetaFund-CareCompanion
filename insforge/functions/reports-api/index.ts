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
  const phone = url.searchParams.get('phone');

  if (!phone) {
    // Return all stored reports
    const { data, error } = await client.database
      .from('monthly_reports')
      .select()
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 400);
    return json(data);
  }

  // Generate a fresh report for a specific senior
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get senior
  const { data: senior } = await client.database
    .from('seniors')
    .select()
    .eq('phone', phone)
    .maybeSingle();
  if (!senior) return json({ error: 'Senior not found' }, 404);

  // Get checkins from last 30 days
  const { data: checkins } = await client.database
    .from('checkins')
    .select()
    .eq('senior_phone', phone)
    .gte('created_at', monthAgo)
    .order('created_at', { ascending: false });

  // Get alerts from last 30 days
  const { data: alerts } = await client.database
    .from('alerts')
    .select()
    .eq('senior_phone', phone)
    .gte('created_at', monthAgo);

  const checkinList = checkins || [];
  const alertList = alerts || [];

  if (checkinList.length === 0) {
    return json({
      status: 'generated',
      senior: senior.name,
      senior_phone: phone,
      period: { from: monthAgo, to: now.toISOString() },
      total_checkins: 0,
      summary: `No check-ins recorded for ${senior.name} in the past 30 days.`,
    });
  }

  // Mood analysis
  const moodCounts: Record<string, number> = {};
  for (const c of checkinList) {
    const m = c.mood || 'unknown';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  }
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Wellness
  const scores = checkinList.map((c: any) => c.wellness_score).filter((s: any) => s != null);
  const avgWellness = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;

  // Medication
  const medTaken = checkinList.filter((c: any) => c.medication_taken === true).length;
  const medPct = checkinList.length > 0 ? Math.round((medTaken / checkinList.length) * 1000) / 10 : 0;

  // Concerns
  const concernCounts: Record<string, number> = {};
  for (const c of checkinList) {
    for (const concern of (c.concerns || [])) {
      concernCounts[concern] = (concernCounts[concern] || 0) + 1;
    }
  }

  // Alert summary
  const alertSeverities: Record<string, number> = {};
  for (const a of alertList) {
    alertSeverities[a.severity] = (alertSeverities[a.severity] || 0) + 1;
  }

  const summary = [
    `${senior.name} had ${checkinList.length} check-ins over the past 30 days.`,
    `Average wellness: ${avgWellness}/10. Most common mood: ${mostCommonMood}.`,
    `Medication adherence: ${medPct}% (${medTaken}/${checkinList.length}).`,
    alertList.length ? `${alertList.length} alerts triggered.` : 'No alerts.',
  ].join(' ');

  const report = {
    status: 'generated',
    senior: senior.name,
    senior_phone: phone,
    period: { from: monthAgo, to: now.toISOString() },
    total_checkins: checkinList.length,
    mood: { distribution: moodCounts, most_common: mostCommonMood },
    wellness: { average: avgWellness, min: Math.min(...scores), max: Math.max(...scores) },
    medication: { adherence_pct: medPct, taken: medTaken, total: checkinList.length },
    concerns: concernCounts,
    alerts: { total: alertList.length, by_severity: alertSeverities },
    summary,
  };

  // Store the report
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await client.database.from('monthly_reports').insert([{
    senior_phone: phone,
    report_month: reportMonth,
    report_data: report,
  }]);

  return json(report);
}
