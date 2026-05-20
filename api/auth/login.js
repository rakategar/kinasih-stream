const { signToken } = require('../_lib/token');
const { supabaseQuery } = require('../_lib/supabase');
const crypto = require('crypto');

function hashPassword(password) {
    const pepper = process.env.JWT_SECRET || 'kinasih-stream-secret-change-in-production';
    return crypto.createHmac('sha256', pepper).update(password).digest('hex');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    try {
        const hash = hashPassword(password);
        const users = await supabaseQuery(
            `access_users?username=eq.${encodeURIComponent(username.trim().toLowerCase())}&password_hash=eq.${encodeURIComponent(hash)}&is_active=eq.true&select=id,username,expires_at`
        );

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const user = users[0];
        const expiresAt = new Date(user.expires_at).getTime();

        if (Date.now() > expiresAt) {
            return res.status(403).json({ error: 'Akses telah habis. Hubungi admin.' });
        }

        const token = signToken({ username: user.username, expiresAt });
        return res.status(200).json({ token, expiresAt, username: user.username });
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ error: 'Server error' });
    }
};
