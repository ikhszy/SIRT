import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function KepemilikanRumahChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    api.get('/households').then((res) => {
      const grouped = {};

      res.data.forEach(hh => {
        const status = hh.kepemilikan_rumah || 'Tidak Diketahui';
        grouped[status] = (grouped[status] || 0) + 1;
      });

      setChartData({
        labels: Object.keys(grouped),
        datasets: [{
          label: 'Jumlah KK',
          data: Object.values(grouped),
          backgroundColor: '#ffa94d'
        }]
      });
    }).catch((err) => {
      console.error('Failed to load households:', err);
      setChartData({ labels: [], datasets: [] }); // fallback empty
    });
  }, []);

  if (!chartData) return <div className="card p-3 mb-4">Loading chart...</div>;

  return (
    <div className="card p-3 mb-4">
      <h5>🏠 Kepemilikan Rumah per KK</h5>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }}
        width={50}    // smaller width
        height={75}   // smaller height
      />
    </div>
  );
}
