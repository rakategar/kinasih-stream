const { verifyToken } = require('../_lib/token');
const { supabaseQuery } = require('../_lib/supabase');
const crypto = require('crypto');

function hashPassword(password) {
    const pepper = process.env.JWT_SECRET || 'kinasih-stream-secret-change-in-production';
    return crypto.createHmac('sha256', pepper).update(password).digest('hex');
}

function requireAdmin(req) {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return null;
    const payload = verifyToken(auth.slice(7));
    return payload?.isAdmin ? payload : null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        if (req.method === 'GET') {
            const users = await supabaseQuery(
                'access_users?select=id,username,expires_at,created_at,is_active&order=created_at.desc'
            );
            return res.status(200).json(users);
        }

        if (req.method === 'POST') {
            const { username, password, duration } = req.body || {};
            if (!username || !password || !duration) {
                return res.status(400).json({ error: 'Username, password, dan durasi diperlukan' });
            }
            const days = duration === '7d' ? 7 : 30;
            const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
            const passwordHash = hashPassword(password);

            const result = await supabaseQuery('access_users', {
                method: 'POST',
                body: JSON.stringify({
                    username: username.trim().toLowerCase(),
                    password_hash: passwordHash,
                    expires_at: expiresAt,
                }),
            });
            return res.status(201).json(result[0]);
        }

        if (req.method === 'DELETE') {
            const id = req.query?.id;
            if (!id) return res.status(400).json({ error: 'ID diperlukan' });
            await supabaseQuery(`access_users?id=eq.${id}`, {
                method: 'DELETE',
                headers: { 'Prefer': '' },
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('Admin users error:', e.message);
        return res.status(500).json({ error: 'Server error: ' + e.message });
    }
};
