import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [openMenus, setOpenMenus] = useState({ dataWarga: false, laporan: false });

  const toggleSubmenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Helper to conditionally show text
  const menuLabel = (text) => !isSidebarCollapsed && <span className="ms-2">{text}</span>;

  return (
    <div className="d-flex" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        className={`bg-primary text-white no-print d-flex flex-column align-items-${isSidebarCollapsed ? 'center' : 'start'}`}
        id="sidebar-wrapper"
        style={{
          width: isSidebarCollapsed ? '70px' : '220px',
          transition: 'width 0.3s ease',
        }}
      >
        <div className="sidebar-heading text-center py-4 fs-5 fw-bold border-bottom w-100">
          {!isSidebarCollapsed ? 'RT Admin' : 'RT'}
        </div>
        <div className="list-group list-group-flush w-100">
          <Link to="/" className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center">
            <i className="fas fa-tachometer-alt"></i>
            {menuLabel('Dashboard')}
          </Link>
          
          {/* Parent menu with dropdown toggle */}
          <div
            className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center justify-content-between"
            onClick={() => toggleSubmenu('dataWarga')}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <i className="fas fa-users"></i>
              {menuLabel('Data Warga')}
            </div>
            {!isSidebarCollapsed && (
              <i className={`fas fa-chevron-${openMenus.dataWarga ? 'down' : 'right'}`}></i>
            )}
          </div>

          {/* Submenu */}
          {openMenus.dataWarga && (
            <div className="bg-primary ps-4">
              <Link
                to="/residents"
                className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center"
              >
                <i className="fas fa-user"></i>
                {menuLabel('Data Warga')}
              </Link>
              <Link
                to="/households"
                className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center"
              >
                <i className="fas fa-home"></i>
                {menuLabel('Data Kartu Keluarga')}
              </Link>
              <Link
                to="/addresses"
                className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center"
              >
                <i className="fas fa-map-marker-alt"></i>
                {menuLabel('Data Alamat')}
              </Link>
            </div>
          )}
          <Link to="/finance" className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center">
            <i className="fas fa-hand-holding-usd"></i>
            {menuLabel('Keuangan')}
          </Link>

          <div
            className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center justify-content-between"
            onClick={() => toggleSubmenu('laporan')}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <i class="fa-solid fa-chart-simple"></i>
              {menuLabel('Laporan')}
            </div>
            {!isSidebarCollapsed && (
              <i className={`fas fa-chevron-${openMenus.laporan ? 'down' : 'right'}`}></i>
            )}
          </div>

          {/* Submenu */}
          {openMenus.laporan && (
            <div className="bg-primary ps-4">
              <Link
                to="/report"
                className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center"
              >
                <i className="fas fa-table"></i>
                {menuLabel('Laporan Data Warga')}
              </Link>
              <Link
                to="/finance/report"
                className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center"
              >
                <i className="fas fa-balance-scale"></i>
                {menuLabel('Laporan Keuangan')}
              </Link>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="list-group-item list-group-item-action bg-primary text-white d-flex align-items-center border-0"
          >
            <i className="fas fa-sign-out-alt"></i>
            {menuLabel('Logout')}
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div id="page-content-wrapper" className="flex-grow-1 bg-light no-print" style={{ minHeight: '100vh' }}>
        {/* Topbar with toggle */}
        <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white shadow-sm">
          <button onClick={toggleSidebar} className="btn btn-link d-md-inline rounded-circle text-dark">
            <i className="fas fa-bars"></i>
          </button>
          <span className="fw-bold">Admin</span>
        </div>

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
