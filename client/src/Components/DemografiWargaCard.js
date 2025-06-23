import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { groupResidentsByAge } from '../utils/groupByAge';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DemografiWargaCard({ residents }) {
  const navigate = useNavigate();
  const ageGroups = groupResidentsByAge(residents);

  const ageGroupLabels = [
    { label: 'Anak (0–12)', key: 'anak', color: '#a3f7bf' },
    { label: 'Remaja (13–17)', key: 'remaja', color: '#fcd34d' },
    { label: 'Dewasa (18–59)', key: 'dewasa', color: '#74c0fc' },
    { label: 'Lansia (60+)', key: 'lansia', color: '#fca5a5' }
  ];

  const data = {
    labels: ageGroupLabels.map(g => g.label),
    datasets: [
      {
        label: 'Jumlah Warga ',
        data: ageGroupLabels.map(g => ageGroups[g.key]),
        backgroundColor: ageGroupLabels.map(g => g.color)
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
      },
      tooltip: { enabled: true }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    },
    onClick: handleClick
  };

  function handleClick(evt, elements) {
    if (!elements.length) return;
    const clickedIndex = elements[0].index;
    const selectedGroup = ageGroupLabels[clickedIndex].key;
    navigate(`/report?age_group=${selectedGroup}`);
  }

  return (
    <div className="card p-3">
      <h6 className="mb-3">
        <i className="fas fa-chart-bar me-1" />
        Warga berdasarkan Umur
      </h6>
      <div style={{ height: '220px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
