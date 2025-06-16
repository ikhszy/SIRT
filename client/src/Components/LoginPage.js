import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Sesi Anda telah berakhir. Silakan login kembali.');
    }
  }, [location.search]);

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
      setError('Username atau password salah');
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center" style={{ marginTop: '10%' }}>
        <div className="col-xl-6 col-lg-8 col-md-9">
          <div className="card o-hidden border-0 shadow-lg">
            <div className="card-body p-5">
              <div className="text-center">
                <h1 className="h4 text-gray-900 mb-4">Welcome Back!</h1>
              </div>

              {error && (
                <div className="alert alert-danger text-center py-2">
                  {error}
                </div>
              )}

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
