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

// Service directory — verified SF Bay Area providers
const SERVICE_DIRECTORY: Record<string, { type: string; providers: Array<{ name: string; phone: string; description: string; website?: string }> }> = {
  shower_help: {
    type: 'shower_help',
    providers: [
      { name: 'Home Instead Senior Care', phone: '(415) 411-6490', description: 'In-home bathing and personal care assistance', website: 'https://www.homeinstead.com' },
      { name: 'Visiting Angels', phone: '(415) 433-6800', description: 'Personal care aides for bathing, grooming, dressing', website: 'https://www.visitingangels.com' },
    ],
  },
  medicine_need: {
    type: 'medicine_need',
    providers: [
      { name: 'Alto Pharmacy', phone: '(415) 570-5873', description: 'Free same-day prescription delivery in SF', website: 'https://www.alto.com' },
      { name: 'Walgreens Pharmacy', phone: '(800) 925-4733', description: 'Prescription delivery and refill services', website: 'https://www.walgreens.com' },
      { name: 'CVS Pharmacy', phone: '(800) 746-7287', description: 'Mail-order and delivery pharmacy services', website: 'https://www.cvs.com' },
    ],
  },
  grocery_help: {
    type: 'grocery_help',
    providers: [
      { name: 'Meals on Wheels SF', phone: '(415) 920-1111', description: 'Home-delivered meals for seniors', website: 'https://www.mowsf.org' },
      { name: 'Project Open Hand', phone: '(415) 447-2300', description: 'Free meals and groceries for seniors', website: 'https://www.openhand.org' },
    ],
  },
  mail_help: {
    type: 'mail_help',
    providers: [
      { name: 'USPS Carrier Pickup', phone: '(800) 275-8777', description: 'Free package pickup from your home', website: 'https://www.usps.com' },
    ],
  },
  transportation: {
    type: 'transportation',
    providers: [
      { name: 'SF Paratransit', phone: '(415) 351-7000', description: 'Door-to-door transit for seniors and disabled', website: 'https://www.sfmta.com' },
      { name: 'GoGoGrandparent', phone: '(855) 464-6872', description: 'Ride service for seniors without smartphones', website: 'https://gogograndparent.com' },
    ],
  },
  emergency: {
    type: 'emergency',
    providers: [
      { name: '911 Emergency', phone: '911', description: 'Life-threatening emergencies' },
      { name: 'UCSF Medical Center', phone: '(415) 476-1000', description: 'Level 1 trauma center', website: 'https://www.ucsfhealth.org' },
      { name: 'SF General Hospital', phone: '(628) 206-8111', description: 'Emergency department', website: 'https://zuckerbergsanfranciscogeneral.org' },
    ],
  },
  companionship: {
    type: 'companionship',
    providers: [
      { name: 'Institute on Aging Friendship Line', phone: '(800) 971-0016', description: '24/7 crisis line for lonely seniors', website: 'https://www.ioaging.org' },
    ],
  },
};

const INFO_211 = {
  name: '211 Bay Area',
  phone: '211',
  website: 'https://www.211bayarea.org',
  description: '24/7 helpline connecting people to local services for food, housing, health, and more.',
  available: '24/7',
  categories: ['food', 'housing', 'health', 'utilities', 'transportation', 'legal', 'employment'],
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const info211 = url.searchParams.get('211');

  // GET ?211=true — return 211 info
  if (info211) {
    return json(INFO_211);
  }

  // GET ?type=shower_help — return specific service
  if (type) {
    const service = SERVICE_DIRECTORY[type];
    return json(service ? service.providers : []);
  }

  // GET — return all services
  return json(SERVICE_DIRECTORY);
}
