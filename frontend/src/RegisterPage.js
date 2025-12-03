import React, { useState } from 'react';

const AUTH_API =
    process.env.REACT_APP_AUTH_API || 'http://localhost:4000/api/auth';


function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const submit = async e => {
        e.preventDefault();
        setMsg('Registering...');

        try {
            const res = await fetch(`${AUTH_API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                setMsg('Registration successful! You may now log in.');
            } else {
                setMsg(data.error || 'Registration failed');
            }
        } catch {
            setMsg('Network error.');
        }
    };

    return (
        <main id="main" className="site-main auth-page">
            <div className="auth-card">
                <h2>Register</h2>
                <p className="auth-message">{msg}</p>

                <form onSubmit={submit}>
                    <label className="visually-hidden" htmlFor="register-email">
                        Email
                    </label>
                    <input
                        id="register-email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                    />

                    <label className="visually-hidden" htmlFor="register-password">
                        Password
                    </label>
                    <input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />

                    <button type="submit">Register</button>
                </form>
            </div>
        </main>
    );
}

export default RegisterPage;
