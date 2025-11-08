
import React, { useState } from 'react';
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setWelcomeMsg('');

    try {
      const res = await axios.post('http://localhost:3001/api/login', {
        username: username,
        password: password,
      });
      setWelcomeMsg(res.data.message);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      setError('Invalid username or password');
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="card">
        <h2>Login to CyberStore</h2>
        <form onSubmit={handleLogin}>
          {error && <p className="error-msg">{error}</p>}
          {welcomeMsg && <p style={{color: 'var(--success)', marginBottom: '1rem'}}>{welcomeMsg}</p>}
          <div>
            <input
              type="text"
              placeholder="Username (e.g., ' OR '1'='1' -- )"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;