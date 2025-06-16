import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/login', { username, password });

      // Save token with 'Bearer' prefix for consistency
      localStorage.setItem('token', `Bearer ${res.data.token}`);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    }
  };

  return (
    <div className="container">
      {/* Outer Row */}
      <div className="row justify-content-center" style={{ marginTop: '10%' }}>
        <div className="col-xl-6 col-lg-8 col-md-9">
          <div className="card o-hidden border-0 shadow-lg">
            <div className="card-body p-5">
              {/* Form Heading */}
              <div className="text-center">
                <h1 className="h4 text-gray-900 mb-4">Welcome Back!</h1>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-user"
                    placeholder="Enter Username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <input
                    type="password"
                    className="form-control form-control-user"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-danger text-center mb-3">{error}</div>}
                <button type="submit" className="btn btn-primary btn-user btn-block w-100">
                  Login
                </button>
              </form>

              <hr />
              <div className="text-center text-muted small">RT DIGITAL LOGIN</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
