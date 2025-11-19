import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { UserContext } from './UserContext';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

function App() {
  const { user, logout } = useContext(UserContext);

  return (
    <>
      <header className="site-header">
        <h1>Clemson Campus Events</h1>

        <div className="auth-bar">
          {user ? (
            <>
              <span>Logged in as <strong>{user.email}</strong></span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link> |{" "}
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </>
  );
}

export default App;
