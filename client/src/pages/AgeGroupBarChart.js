import React, { useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

export default function AgeGroupBarChart({ residents }) {
  const navigate = useNavigate();
  const chartRef = useRef();

  const calculateAge = (birthdate) => {
    const birth = new Date(birthdate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const ageGroups = [
    { label: 'Children', min: 0, max: 9, color: '#4e73df' },
    { label: 'Teenager', min: 10, max: 18, color: '#1cc88a' },
    { label: 'Adult', min: 19, max: 59, color: '#36b9cc' },
    { label: 'Elder', min: 60, max: 150, color: '#f6c23e' },
  ];

  const groupCounts = ageGroups.map(({ min, max }) => {
    return residents.filter(r => {
      const age = calculateAge(r.birthdate);
      return age >= min && age <= max;
    }).length;
  });

  const chartData = {
    labels: ageGroups.map(g => g.label),
    datasets: [
      {
        label: 'Jumlah Warga',
        data: groupCounts,
        backgroundColor: ageGroups.map(g => g.color),
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const handleClick = (event) => {
    const elements = getElementAtEvent(chartRef.current, event);
    if (!elements.length) return;

    const index = elements[0].index;
    const { min, max } = ageGroups[index];
    navigate(`/report?minAge=${min}&maxAge=${max}`);
  };

  return (
    <Bar
      ref={chartRef}
      data={chartData}
      options={chartOptions}
      onClick={handleClick}
    />
  );
}
