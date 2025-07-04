import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import logo from '../logo.svg'; // <-- make sure this path is correct

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

    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong');
      return;
    }

    try {
      const res = await api.post('/login', { username, password });

      localStorage.setItem('token', `Bearer ${res.data.token}`);
      navigate('/dashboard');
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
              <div className="text-center mb-4 d-flex align-items-center justify-content-center gap-2">
                <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', marginRight: '10px' }} />
                <h1 className="h4 text-gray-900 mb-0">Selamat Datang!</h1>
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
                    placeholder="username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group mb-3">
                  <input
                    type="password"
                    className="form-control form-control-user"
                    placeholder="password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-user btn-block w-100">
                  MASUK
                </button>
              </form>

              <hr />
              <div className="text-center text-muted small">Hubungi admin untuk mendapatkan akun</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
