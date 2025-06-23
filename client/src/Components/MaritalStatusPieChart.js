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

export default function MaritalStatusPieChart({ residents }) {
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const statusCounts = residents.reduce((acc, r) => {
    const key = r.marital_status || 'Tidak Diketahui';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(statusCounts);
  const backgroundColors = ['#b197fc', '#ffec99', '#ffccd5', '#b2f2bb', '#ced4da']; // Add more if needed

  const data = {
    labels,
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: backgroundColors.slice(0, labels.length)
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Using custom legend instead
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
    const selectedStatus = labels[index];

    navigate(`/report?marital_status=${encodeURIComponent(selectedStatus)}`);
  };

  return (
    <div className="card p-3 h-100" style={{ minHeight: '240px' }}>
      <h6 className="mb-3">💍 Berdasarkan Status Perkawinan</h6>
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
