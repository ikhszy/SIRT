import React, { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function KeuanganOverviewCard() {
  const [period, setPeriod] = useState('monthly');
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [iuranSummary, setIuranSummary] = useState({ paid: 0, unpaid: 0 });

  useEffect(() => {
    api.get(`/finance/summary?type=income&groupBy=${period}`).then(res => setIncomeData(res.data));
    api.get(`/finance/summary?type=expense&groupBy=${period}`).then(res => setExpenseData(res.data));
    api.get('/finance/iuran-summary').then(res => setIuranSummary(res.data));
  }, [period]);

  const incomeChart = {
    labels: incomeData.map(item => item.period),
    datasets: [{
      label: 'Pemasukan',
      data: incomeData.map(item => item.total),
      borderColor: '#ffa94d',
      backgroundColor: '#ffa94d',
      fill: false
    }]
  };

  const expenseChart = {
    labels: expenseData.map(item => item.period),
    datasets: [{
      label: 'Pengeluaran',
      data: expenseData.map(item => item.total),
      borderColor: '#ff6b6b',
      backgroundColor: '#ff6b6b',
      fill: false
    }]
  };

  const donutChart = {
    labels: ['Sudah Bayar', 'Belum Bayar'],
    datasets: [{
      data: [iuranSummary.paid, iuranSummary.unpaid],
      backgroundColor: ['#38d9a9', '#ffa94d']
    }]
  };

  return (
    <div className="card p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>💰 Keuangan Overview</h5>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="form-select w-auto">
          <option value="daily">Harian</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>
      <div className="row">
        <div className="col-md-6 mb-4">
          <Line data={incomeChart} options={{ plugins: { legend: { display: true } } }} />
        </div>
        <div className="col-md-6 mb-4">
          <Line data={expenseChart} options={{ plugins: { legend: { display: true } } }} />
        </div>
        <div className="col-md-4 offset-md-4">
          <Doughnut data={donutChart} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  );
}
