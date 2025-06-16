import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';

export default function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleDelete = async (id) => {
  if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers(users.filter(user => user.userId !== id));
    } catch (err) {
      alert('Gagal menghapus pengguna');
    }
  }
};


  return (
    <AdminLayout>
      <div className="card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Daftar Pengguna</h3>
          <Link to="/users/add" className="btn btn-primary">+ Tambah Pengguna</Link>
        </div>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId}>
                <td>{user.userId}</td>
                <td>{user.username}</td>
                <td>{user.role || '-'}</td>
                <td>{user.date_created}</td>
                <td>
                  <Link to={`/pengguna/edit/${user.userId}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(user.userId)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
