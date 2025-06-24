import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import AdminLayout from '../layouts/AdminLayout';
import api from '../api';

// Components
import TotalResidentsCard from '../Components/TotalResidentsCard';
import DemografiWargaCard from '../Components/DemografiWargaCard';
import KepemilikanRumahChart from '../Components/KepemilikanRumah';
import GenderPieChart from '../Components/GenderPieChart';
import MaritalStatusPieChart from '../Components/MaritalStatusPieChart';
import KeuanganOverviewCard from '../Components/KeuanganOverviewCard';

export default function Dashboard() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/residents')
      .then(res => setResidents(res.data))
      .catch(err => console.error('Failed to fetch residents:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <h1 className="h3 mb-4 text-gray-800">
          <i className="fas fa-tachometer-alt me-2" /> Dashboard
        </h1>

        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <Row className="g-4 mb-4">
              {/* Left: Warga Overview */}
              <Col md={6}>
                <Card className="p-3 h-100">
                  <h5 className="mb-4">👥 Warga Overview</h5>

                  {/* Row 1: Total Warga */}
                  <Row className="g-3 mb-3">
                    <Col md={4}>
                      <div style={{ height: '250px' }}>
                        <TotalResidentsCard residents={residents} />
                      </div>
                    </Col>
                    <Col md={8}>
                      {/* Row 2: Pie Charts inside same Col */}
                      <Row className="g-3">
                        <Col md={6}>
                          <div style={{ height: '250px' }}>
                            <GenderPieChart residents={residents} />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ height: '250px' }}>
                            <MaritalStatusPieChart residents={residents} />
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {/* Row 3: Demografi Warga */}
                  <Row>
                    <Col>
                      <div>
                        <DemografiWargaCard residents={residents} />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Right: Keuangan Overview */}
              <Col md={6}>
                <Card className="p-3 h-100">
                  <KeuanganOverviewCard
                    onOpenRiwayat={({ bulan, tahun }) =>
                      navigate('/finance', {
                        state: {
                          tab: 'riwayat',
                          filters: { bulan, tahun, alamat: '' },
                        },
                      })
                    }
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
