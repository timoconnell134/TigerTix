import React, { useState } from 'react';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const submit = async e => {
        e.preventDefault();
        setMsg("Registering...");

        try {
            const res = await fetch("http://localhost:4000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                setMsg("Registration successful! You may now log in.");
            } else {
                setMsg(data.error || "Registration failed");
            }
        } catch {
            setMsg("Network error.");
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <p>{msg}</p>
            <form onSubmit={submit}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <button>Register</button>
            </form>
        </div>
    );
}

export default RegisterPage;
