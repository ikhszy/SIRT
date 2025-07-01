import React, { useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function GenderPieChart({ residents }) {
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const genderCounts = residents.reduce((acc, r) => {
    const key = r.gender || 'Tidak Diketahui';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(genderCounts);
  const backgroundColors = ['#4dabf7', '#ff87ab', '#dee2e6']; // Male, Female, Unknown

  const data = {
    labels,
    datasets: [
      {
        data: Object.values(genderCounts),
        backgroundColor: backgroundColors
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We'll use custom legend
      },
      tooltip: {
        enabled: true
      }
    }
  };

  const onClick = (event) => {
    const chart = chartRef.current;
    if (!chart) return;

    const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (!elements.length) return;

    const index = elements[0].index;
    const selectedGender = labels[index];
    navigate(`/report?gender=${encodeURIComponent(selectedGender)}`);
  };

  return (
    <div className="card p-3 h-100" style={{ minHeight: '240px' }}>
      <h6 className="mb-3">🧑‍🤝‍🧑 Jenis Kelamin</h6>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', maxHeight: '150px' }}>
          <Pie ref={chartRef} data={data} options={options} onClick={onClick} />
        </div>
        <div style={{ flex: '1 1 40%', paddingLeft: '1rem' }}>
        </div>
      </div>
    </div>
  );
}
