// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const styles = require('./styles');

const TOKEN_KEY = 'kinasih_access_token';

function decodeToken(raw) {
    try {
        const dot = raw.lastIndexOf('.');
        if (dot === -1) return null;
        const b64 = raw.slice(0, dot).replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(b64));
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
            localStorage.removeItem(TOKEN_KEY);
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

function getStoredToken() {
    try {
        const raw = localStorage.getItem(TOKEN_KEY);
        return raw ? decodeToken(raw) : null;
    } catch {
        return null;
    }
}

const AccessGate = ({ children, bypass }) => {
    const [authed, setAuthed] = React.useState(() => bypass || getStoredToken() !== null);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleLogin = React.useCallback(async (e) => {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError('Username dan password harus diisi');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login gagal');
                return;
            }
            localStorage.setItem(TOKEN_KEY, data.token);
            setAuthed(true);
        } catch {
            setError('Tidak dapat terhubung ke server');
        } finally {
            setLoading(false);
        }
    }, [username, password]);

    const handleKeyDown = React.useCallback((e) => {
        if (e.key === 'Enter') handleLogin(e);
    }, [handleLogin]);

    if (authed) return children;

    return (
        <div className={styles['gate-container']}>
            <div className={styles['gate-box']}>
                <img className={styles['gate-logo']} src={'images/logo.png'} alt={'Kinasih Stream'} />
                <h1 className={styles['gate-title']}>{'Kinasih Stream'}</h1>
                <p className={styles['gate-subtitle']}>{'Masukkan akses yang diberikan admin'}</p>
                <form className={styles['gate-form']} onSubmit={handleLogin}>
                    <input
                        className={styles['gate-input']}
                        type={'text'}
                        placeholder={'Username'}
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete={'username'}
                        autoFocus
                    />
                    <input
                        className={styles['gate-input']}
                        type={'password'}
                        placeholder={'Password'}
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete={'current-password'}
                    />
                    {error ? <div className={styles['gate-error']}>{error}</div> : null}
                    <button className={styles['gate-button']} type={'submit'} disabled={loading}>
                        {loading ? 'Memverifikasi...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
};

module.exports = AccessGate;
