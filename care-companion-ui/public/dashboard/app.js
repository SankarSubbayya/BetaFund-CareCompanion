// InsForge configuration
const INSFORGE_BASE = 'https://4b7tn66d.us-east.insforge.app';
const INSFORGE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Nzc3MTV9.9TRZTYQE4h_zfD9pJqjslK8ShivTpZ0IWmsgqbFfPYg';

let wellnessChart = null;
let allSeniors = [];
let allCheckins = [];
let auth0Client = null;
let authToken = null;

const AUTH0_DOMAIN = 'dev-dvczcoreg5bs2tle.us.auth0.com';
const AUTH0_CLIENT_ID = 'AHyKi5afMQu5MyFrlZBmkESEPtE4RUjx';
const AUTH0_AUDIENCE = 'https://dev-dvczcoreg5bs2tle.us.auth0.com/api/v2/';

const AVATAR_COLORS = ['avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-pink', 'avatar-teal'];
const MOOD_EMOJIS = { happy: '😊', neutral: '😐', sad: '😢', concerning: '😟', unknown: '❓' };

// ── Helpers ──

// Call InsForge edge function
async function invokeFunction(slug, opts = {}) {
    const url = `${INSFORGE_BASE}/functions/${slug}${opts.query || ''}`;
    const resp = await fetch(url, {
        method: opts.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
}

// Database operations via edge functions
async function dbQuery(table, opts = {}) {
    // Map table names to edge function slugs
    const slugMap = {
        seniors: 'seniors-api',
        checkins: 'checkins-api',
        alerts: 'alerts-api',
        service_recommendations: 'services-api',
        monthly_reports: 'reports-api',
    };
    const slug = slugMap[table] || table;
    const queryStr = opts.query ? `?${opts.query}` : '';

    return invokeFunction(slug, {
        method: opts.method || 'GET',
        query: queryStr,
        body: opts.body,
    });
}

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
    let hash = 0;
    for (const ch of name) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatPhone(phone) {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') {
        return `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
    }
    return phone;
}

function isToday(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

// ── Page Navigation ──

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));

    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => {
        if (item.textContent.trim().toLowerCase().replace(/\s+/g, '-').includes(pageId.replace('-', ''))) {
            item.classList.add('active');
        }
    });

    if (pageId === 'checkins') loadAllCheckins();
    if (pageId === 'medications') loadMedications();
    if (pageId === 'services') loadServicesPage();
    if (pageId === 'alerts') loadAlertsPage();
    if (pageId === 'settings') loadSettings();
}

// ── Loved Ones (Main Table) ──

async function loadSeniors() {
    try {
        const seniors = await invokeFunction('seniors-api');
        const checkins = await invokeFunction('checkins-api');
        allSeniors = seniors;

        // Build latest checkin per senior
        const checkinMap = {};
        checkins.forEach(c => {
            if (!checkinMap[c.senior_phone]) checkinMap[c.senior_phone] = c;
        });

        // Stats
        const total = seniors.length;
        const checkedToday = seniors.filter(s => {
            const c = checkinMap[s.phone];
            return c && isToday(c.timestamp);
        }).length;
        const pending = total - checkedToday;
        const scores = checkins.filter(c => c.wellness_score > 0).map(c => c.wellness_score);
        const avg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : '—';

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-checked').textContent = checkedToday;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-avg').textContent = avg + '/10';

        renderSeniorsTable(seniors, checkinMap);
    } catch (e) {
        console.error('Failed to load seniors:', e);
        document.getElementById('seniors-tbody').innerHTML =
            '<tr><td colspan="5" class="empty-state">Failed to load. Is the server running?</td></tr>';
    }
}

function renderSeniorsTable(seniors, checkinMap) {
    const tbody = document.getElementById('seniors-tbody');

    if (seniors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No seniors added yet. Click "+ Add Senior".</td></tr>';
        return;
    }

    tbody.innerHTML = seniors.map(s => {
        const latest = checkinMap ? checkinMap[s.phone] : null;
        const hasCheckin = latest && latest.timestamp;
        const today = hasCheckin && isToday(latest.timestamp);

        let statusClass, statusText;
        if (!hasCheckin) {
            statusClass = 'pending';
            statusText = 'Pending';
        } else if (latest.mood === 'concerning') {
            statusClass = 'concerning';
            statusText = 'Concerning';
        } else if (latest.mood === 'sad') {
            statusClass = 'sad';
            statusText = 'Needs attention';
        } else if (today) {
            statusClass = 'checked-in';
            statusText = 'Checked in';
        } else {
            statusClass = 'pending';
            statusText = 'Pending';
        }

        const score = latest?.wellness_score || '—';
        const meds = s.medications.length ? s.medications.join(', ') : '—';

        return `
            <tr>
                <td>
                    <div class="name-cell">
                        <div class="avatar ${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
                        <div class="name-info">
                            <div class="name">${s.name}</div>
                            <div class="phone">${formatPhone(s.phone)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <span class="dot"></span> ${statusText}
                    </span>
                </td>
                <td>${score === '—' ? '—' : score + '/10'}</td>
                <td style="max-width:200px;font-size:0.85rem;">${meds}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-small" onclick="triggerCall('${s.phone}')">Call</button>
                        <button class="btn btn-small" onclick="showDetail('${s.phone}')">History</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterSeniors() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allSeniors.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.phone.includes(query) ||
        formatPhone(s.phone).includes(query)
    );

    // Re-fetch checkin map for filtered display
    invokeFunction('checkins-api').then(checkins => {
        const checkinMap = {};
        checkins.forEach(c => { if (!checkinMap[c.senior_phone]) checkinMap[c.senior_phone] = c; });
        renderSeniorsTable(filtered, checkinMap);
    });
}

// ── Alerts ──

async function loadAlertsBanner() {
    try {
        const allAlerts = await invokeFunction('alerts-api');
        const alerts = allAlerts.filter(a => !a.acknowledged);
        const banner = document.getElementById('alerts-banner');
        const content = document.getElementById('alerts-banner-content');
        const badge = document.getElementById('alert-badge');

        if (alerts.length === 0) {
            banner.style.display = 'none';
            badge.style.display = 'none';
            return;
        }

        badge.style.display = 'inline';
        badge.textContent = alerts.length;

        // Show top 3 in banner
        const top = alerts.slice(0, 3);
        banner.style.display = 'block';
        content.innerHTML = top.map(a => `
            <div class="alert-banner-item">
                <span class="severity ${a.severity}">${a.severity}</span>
                <span>${a.message}</span>
                <button class="btn btn-small" style="margin-left:auto;" onclick="acknowledgeAlert('${a.id}')">Dismiss</button>
            </div>
        `).join('') + (alerts.length > 3 ? `<div style="font-size:0.8rem;color:var(--gray-500);margin-top:0.25rem;">+ ${alerts.length - 3} more alerts</div>` : '');
    } catch (e) {
        console.error('Failed to load alerts:', e);
    }
}

async function loadAlertsPage() {
    try {
        const alerts = await invokeFunction('alerts-api');
        const list = document.getElementById('alerts-full-list');

        if (alerts.length === 0) {
            list.innerHTML = '<p class="empty-state">No alerts.</p>';
            return;
        }

        list.innerHTML = alerts.map(a => `
            <div class="alert-card ${a.severity}">
                <div style="flex:1;">
                    <div><span class="severity ${a.severity}">${a.severity}</span> <strong>${a.alert_type.replace(/_/g, ' ')}</strong></div>
                    <div style="margin-top:0.25rem;">${a.message}</div>
                    <div class="alert-meta">${new Date(a.timestamp).toLocaleString()} ${a.acknowledged ? '(acknowledged)' : ''}</div>
                </div>
                ${!a.acknowledged ? `<button class="btn btn-small" onclick="acknowledgeAlert('${a.id}')">Acknowledge</button>` : ''}
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load alerts page:', e);
    }
}

async function acknowledgeAlert(alertId) {
    await invokeFunction('alerts-api', { method: 'PUT', query: `?id=${alertId}` });
    refreshAll();
}

// ── Check-ins Page ──

async function loadAllCheckins() {
    try {
        const checkins = await invokeFunction('checkins-api');
        const seniors = await invokeFunction('seniors-api');
        const seniorMap = {};
        seniors.forEach(s => { seniorMap[s.phone] = s.name; });

        const tbody = document.getElementById('checkins-tbody');
        tbody.innerHTML = checkins.slice(0, 50).map(c => {
            const svcLabels = (c.service_requests || []).map(r => r.label || r.type).join(', ');
            return `
                <tr>
                    <td>${new Date(c.timestamp).toLocaleString()}</td>
                    <td>${seniorMap[c.senior_phone] || c.senior_phone}</td>
                    <td>${MOOD_EMOJIS[c.mood] || '❓'} ${c.mood}</td>
                    <td>${c.wellness_score}/10</td>
                    <td>${c.medication_taken === true ? '✅' : c.medication_taken === false ? '❌' : '—'}</td>
                    <td>${svcLabels || '—'}</td>
                    <td style="max-width:200px;font-size:0.85rem;">${c.summary || '—'}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7" class="empty-state">No check-ins yet.</td></tr>';
    } catch (e) {
        console.error('Failed to load checkins:', e);
    }
}

// ── Medications Page ──

async function loadMedications() {
    try {
        const seniors = await invokeFunction('seniors-api');
        const checkins = await invokeFunction('checkins-api');
        const checkinMap = {};
        checkins.forEach(c => { if (!checkinMap[c.senior_phone]) checkinMap[c.senior_phone] = c; });

        const tbody = document.getElementById('meds-tbody');
        tbody.innerHTML = seniors.map(s => {
            const latest = checkinMap[s.phone];
            const taken = latest?.medication_taken;
            const lastTime = latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : '—';
            const compliance = taken === true ? '✅ Taken' : taken === false ? '❌ Missed' : '—';
            const compClass = taken === false ? 'color:var(--danger)' : taken === true ? 'color:var(--success)' : '';

            return `
                <tr>
                    <td>
                        <div class="name-cell">
                            <div class="avatar ${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
                            <div class="name-info"><div class="name">${s.name}</div></div>
                        </div>
                    </td>
                    <td>${s.medications.length ? s.medications.join(', ') : '—'}</td>
                    <td>${lastTime}</td>
                    <td style="${compClass};font-weight:500;">${compliance}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" class="empty-state">No seniors added.</td></tr>';
    } catch (e) {
        console.error('Failed to load medications:', e);
    }
}

// ── Services Page ──

async function loadServicesPage() {
    loadServiceDirectory();
    loadServiceRequests();
}

async function loadServiceDirectory() {
    try {
        const services = await invokeFunction('services-api');
        const container = document.getElementById('service-directory');
        const icons = {
            shower_help: '🚿', medicine_need: '💊', food_order: '🍽️',
            mail_help: '📬', medical_emergency: '🚑', transportation: '🚗',
            companionship: '💛',
        };

        container.innerHTML = Object.entries(services).map(([type, svcs]) => `
            <div class="dir-category">
                <h3>${icons[type] || '📌'} ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                ${svcs.map(s => `
                    <div class="dir-service">
                        <div class="name">${s.name} ${s.source ? `<span class="source-tag">${s.source}</span>` : ''}</div>
                        <div class="desc">${s.description}</div>
                        <div class="phone-hours">📞 <a href="tel:${s.phone}">${s.phone}</a> ${s.hours ? '• ' + s.hours : ''}</div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load service directory:', e);
    }
}

async function loadServiceRequests() {
    try {
        const alerts = await invokeFunction('alerts-api');
        const serviceAlerts = alerts.filter(a => a.alert_type === 'service_request');

        const section = document.getElementById('service-requests-section');
        const list = document.getElementById('service-requests-list');

        if (serviceAlerts.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        let recommendations = [];
        try { recommendations = []; /* service recommendations loaded via alerts */ } catch(e) {}
        const recMap = {};
        recommendations.forEach(r => { recMap[r.request_type] = r; });

        list.innerHTML = serviceAlerts.map(a => {
            const typeMatch = a.id.match(/service_(\w+)$/);
            const svcType = typeMatch ? typeMatch[1] : '';
            const rec = recMap[svcType];

            let servicesHtml = '';
            if (rec && rec.recommended_services) {
                servicesHtml = `<div class="recommended"><strong>Recommended:</strong><br>${rec.recommended_services.slice(0,3).map(s =>
                    `• ${s.name} — <a href="tel:${s.phone}">${s.phone}</a> (${s.hours})<br>`
                ).join('')}</div>`;
            }

            return `
                <div class="service-card ${a.severity === 'critical' ? 'critical' : ''}">
                    <div class="service-card-header">
                        <span class="label">${a.senior_name || a.senior_phone}</span>
                        <span class="badge ${a.severity}">${a.severity}</span>
                    </div>
                    <div class="details">${a.message}</div>
                    ${servicesHtml}
                    <button class="btn btn-small" style="margin-top:0.5rem;" onclick="acknowledgeAlert('${a.id}')">Mark Handled</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load service requests:', e);
    }
}

// ── Detail Panel ──

async function showDetail(phone) {
    const panel = document.getElementById('detail-panel');
    panel.style.display = 'flex';

    const [senior, checkins] = await Promise.all([
        invokeFunction('seniors-api', { query: `?phone=${encodeURIComponent(phone)}` }),
        invokeFunction('checkins-api', { query: `?phone=${encodeURIComponent(phone)}` }),
    ]);

    document.getElementById('detail-name').textContent = `${senior.name} — Check-in History`;

    const chartCheckins = [...checkins].reverse().slice(-14);
    const ctx = document.getElementById('detail-wellness-chart').getContext('2d');

    if (wellnessChart) wellnessChart.destroy();
    wellnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartCheckins.map(c => new Date(c.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'Wellness Score',
                data: chartCheckins.map(c => c.wellness_score),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 10, title: { display: true, text: 'Score' } } },
            plugins: { legend: { display: false } },
        },
    });

    const history = document.getElementById('detail-checkin-history');
    history.innerHTML = `
        <h3 style="margin-bottom:0.75rem;">Recent Check-ins</h3>
        <table class="data-table">
            <thead><tr><th>DATE</th><th>MOOD</th><th>SCORE</th><th>MEDS</th><th>REQUESTS</th><th>SUMMARY</th></tr></thead>
            <tbody>
                ${checkins.map(c => {
                    const svcLabels = (c.service_requests || []).map(r => r.label || r.type).join(', ');
                    return `<tr>
                        <td>${new Date(c.timestamp).toLocaleString()}</td>
                        <td>${MOOD_EMOJIS[c.mood] || '❓'} ${c.mood}</td>
                        <td>${c.wellness_score}/10</td>
                        <td>${c.medication_taken === true ? '✅' : c.medication_taken === false ? '❌' : '—'}</td>
                        <td>${svcLabels || '—'}</td>
                        <td style="max-width:200px;font-size:0.85rem;">${c.summary || '—'}</td>
                    </tr>`;
                }).join('')}
                ${checkins.length === 0 ? '<tr><td colspan="6" class="empty-state">No check-ins yet</td></tr>' : ''}
            </tbody>
        </table>
    `;
}

function closeDetail() {
    document.getElementById('detail-panel').style.display = 'none';
    if (wellnessChart) { wellnessChart.destroy(); wellnessChart = null; }
}

// ── Actions ──

async function triggerCall(phone) {
    try {
        const result = await invokeFunction('checkins-api', {
            method: 'POST',
            query: `?phone=${encodeURIComponent(phone)}&action=trigger`,
            body: { senior_phone: phone },
        });
        alert(`Check-in call initiated!`);
    } catch (e) {
        alert('Failed to trigger call: ' + e.message);
    }
}

// ── Add Senior ──

function showAddSeniorModal() { document.getElementById('add-senior-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-senior-modal').style.display = 'none'; }

async function addSenior(event) {
    event.preventDefault();
    const senior = {
        name: document.getElementById('senior-name').value,
        phone: document.getElementById('senior-phone').value,
        medications: document.getElementById('senior-meds').value.split(',').map(m => m.trim()).filter(Boolean),
        checkin_schedule: document.getElementById('senior-schedule').value,
        notes: document.getElementById('senior-notes').value,
        emergency_contacts: [],
    };
    try {
        await invokeFunction('seniors-api', { method: 'POST', body: senior });
        closeModal();
        document.getElementById('add-senior-form').reset();
        loadSeniors();
    } catch (e) {
        alert('Failed to add senior: ' + e.message);
    }
}

// ── Settings ──

function loadSettings() {
    document.getElementById('webhook-url').textContent = window.location.origin + '/api/webhooks/bland/call-complete';
    document.getElementById('auth-status').textContent = 'skipped (development mode)';
}

// ── Refresh ──

function refreshAll() {
    loadSeniors();
    loadAlertsBanner();
}

// ── Auth0 ──

async function initAuth() {
    // Auth0 disabled — go straight to dashboard
    showApp();
}

async function login() {
    if (auth0Client) {
        const currentOrigin = window.location.origin;
        console.log('Login redirect_uri:', currentOrigin);
        await auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: currentOrigin,
            },
        });
    } else {
        showApp();
    }
}

async function logout() {
    if (auth0Client) {
        await auth0Client.logout({ logoutParams: { returnTo: window.location.origin } });
    } else {
        showLogin();
    }
}

async function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('sidebar').style.display = 'flex';
    document.getElementById('main-content').style.display = 'block';

    // Show user info in sidebar
    try {
        if (auth0Client) {
            const user = await auth0Client.getUser();
            if (user) {
                document.getElementById('sidebar-user').textContent = user.email || user.name || '';
            }
        }
    } catch (e) { /* ignore */ }

    refreshAll();
    setInterval(refreshAll, 15000);
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initAuth);
