const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabaseQuery(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...(options.headers || {}),
        },
    });
    if (res.status === 204) return [];
    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase error ${res.status}: ${text}`);
    if (!text) return [];
    return JSON.parse(text);
}

module.exports = { supabaseQuery };
