import AdminLayout from '../layouts/AdminLayout';
import React, { useEffect, useState } from 'react';
import AgeGroupBarChart from "./AgeGroupBarChart";
import axios from "axios";
import api from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,   // This is the important part
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [residents, setResidents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResidents() {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/residents', { 
          headers: { Authorization: `Bearer ${token}` },
        });
        setResidents(res.data);
      } catch (err) {
        console.error('Failed to fetch residents:', err);
        setError('Failed to load residents data.');
      }
    }

    fetchResidents();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4">Dashboard</h1>
      <p>Selamat datang di aplikasi warga!</p>

      <div>
        <h5>Total warga berdasarkan umur</h5>
        <AgeGroupBarChart residents={residents} />
      </div>
    </AdminLayout>
  );
}