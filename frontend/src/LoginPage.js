import React, { useState, useContext } from 'react';
import { UserContext } from './UserContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const { login } = useContext(UserContext);
    const navigate = useNavigate();

    const submit = async e => {
        e.preventDefault();
        setMsg('Logging in...');

        try {
            const res = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.email, data.token);
                navigate('/');
            } else {
                setMsg(data.error || 'Login failed.');
            }
        } catch {
            setMsg('Network error.');
        }
    };

    return (
        <main id="main" className="site-main auth-page">
            <div className="auth-card">
                <h2>Login</h2>
                <p className="auth-message">{msg}</p>

                <form onSubmit={submit}>
                    <label className="visually-hidden" htmlFor="login-email">
                        Email
                    </label>
                    <input
                        id="login-email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                    />

                    <label className="visually-hidden" htmlFor="login-password">
                        Password
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />

                    <button type="submit">Login</button>
                </form>
            </div>
        </main>
    );
}

export default LoginPage;
