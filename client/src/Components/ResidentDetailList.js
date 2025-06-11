import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResidents(res.data);
      } catch (err) {
        console.error('Failed to fetch residents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4">Residents Data</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-primary">
              <tr>
                <th>Name</th>
                <th>NIK</th>
                <th>Gender</th>
                <th>Birthplace</th>
                <th>Birthdate</th>
                <th>KK Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {residents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No data available</td>
                </tr>
              ) : (
                residents.map((res) => (
                  <tr key={res.id}>
                    <td>{res.full_name}</td>
                    <td>{res.nik}</td>
                    <td>{res.gender}</td>
                    <td>{res.birthplace}</td>
                    <td>{res.birthdate}</td>
                    <td>{res.kk_number}</td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}