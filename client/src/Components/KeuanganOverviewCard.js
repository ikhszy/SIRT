import React, { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function KeuanganOverviewCard({ onOpenRiwayat  }) {
  const [period, setPeriod] = useState('monthly');
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [iuranSummary, setIuranSummary] = useState({ paid: 0, unpaid: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/finance/summary?type=income&groupBy=${period}`).then(res => setIncomeData(res.data));
    api.get(`/finance/summary?type=expense&groupBy=${period}`).then(res => setExpenseData(res.data));
    api.get('/finance/iuran-summary').then(res => setIuranSummary(res.data));
  }, [period]);

  // Date range calculation
  const formatLocalDate = (date) => date.toLocaleDateString('sv-SE'); // outputs 'YYYY-MM-DD'

  const now = new Date();
  const startDate = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const endDate = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Click handlers
  const handleLineClick = (status) => {
    navigate('/finance/report', {
      state: {
        filters: {
          rentangTanggal: [startDate, endDate],
          status
        }
      }
    });
  };

  const handleIuranClick = () => {
    navigate('/finance', {
      state: {
        tab: 'riwayat',
        filters: {
          alamat: '',
          bulan: currentMonth,
          tahun: currentYear
        }
      }
    });
  };

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
        <div className="col-md-6 mb-4" onClick={() => handleLineClick('Pemasukan')} style={{ cursor: 'pointer' }}>
          <Line data={incomeChart} options={{ plugins: { legend: { display: true } } }} />
        </div>
        <div className="col-md-6 mb-4" onClick={() => handleLineClick('Pengeluaran')} style={{ cursor: 'pointer' }}>
          <Line data={expenseChart} options={{ plugins: { legend: { display: true } } }} />
        </div>
        <div
          className="col-md-4 offset-md-4"
          onClick={() => {
            console.log('✅ Triggered donut click');
            if (onOpenRiwayat) {
              const now = new Date();
              const bulan = now.getMonth() + 1;
              const tahun = now.getFullYear();
              console.log('🟡 Passing to onOpenRiwayat:', { bulan, tahun });
              onOpenRiwayat({ bulan, tahun });
            } else {
              console.warn('⚠️ onOpenRiwayat not defined');
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <Doughnut
            data={donutChart}
            options={{
              plugins: { legend: { position: 'bottom' } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
