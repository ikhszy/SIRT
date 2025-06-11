import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import LoginPage from './Components/LoginPage';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import ProtectedRoute from './Components/ProtectedRoute';
import AddResident from './pages/AddResident';
import EditResident from './pages/EditResident';
import Households from './pages/Households';
import EditHousehold from './pages/EditHousehold';
import AddHousehold from './pages/AddHousehold';
import Addresses from './pages/Addresses';
import AddAddress from './pages/AddAddress';
import EditAddress from './pages/EditAddress';
import BulkImportResidents from './pages/BulkImportResidents';
import ResidentReport from './pages/ResidentReport';
import AddressBulkImport from './pages/AddressBulkImport';
import BulkImportHouseholds from './pages/BulkImportHouseholds';
import BulkImportAddress from './pages/AddressBulkImport';
import Finance from './pages/Finance';
import AddFinance from './pages/AddFinance';
import EditFinance from './pages/EditFinance';
import FinanceReport from './pages/FinanceReport';
import BulkImportFinance from './pages/BulkImportFinance';

function App() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<ProtectedRoute isLoggedIn={isLoggedIn}><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/residents"
          element={<ProtectedRoute isLoggedIn={isLoggedIn}><Residents /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
        <Route path="/residents/add" element={<AddResident />} />
        <Route path="/residents/view/:id" element={<EditResident />} />
        <Route path="/residents/edit/:id" element={<EditResident />} />
        <Route path="/residents/import" element={<BulkImportResidents />} />
        <Route path="/households" element={<Households />} />
        <Route path="/households/edit/:kk_number" element={<EditHousehold />} />
        <Route path="/households/add" element={<AddHousehold />} />
        <Route path="/addresses" element={<Addresses />} />
        <Route path="/addresses/add" element={<AddAddress />} />
        <Route path="/addresses/import" element={<AddressBulkImport />} />
        <Route path="/addresses/edit/:id" element={<EditAddress />} />
        <Route path="/report" element={<ResidentReport />} />
        <Route path="/households/import" element={<BulkImportHouseholds />} />
        <Route path="/address/import" element={<BulkImportAddress />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/finance/add" element={<AddFinance />} />
        <Route path="/finance/edit/:type/:id" element={<EditFinance />} />
        <Route path="/finance/report" element={<FinanceReport />} />
        <Route path="/finance/import" element={<BulkImportFinance />} />
      </Routes>
    </Router>
  );
}

export default App;