// src/AppRoutes.js
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ProtectedRoute from './Components/ProtectedRoute';
import LoginPage from './Components/LoginPage';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
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
import SettingsPage from './pages/SettingsPage';
import UsersList from './pages/UsersList';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import IntroLetterPage from './pages/SuratPengantar/IntroLetterPage';
import SuratPreviewPage from './pages/SuratPengantar/SuratPreviewPage';
import IntroLetterForm from './pages/SuratPengantar/IntroLetterForm';
import InventoryList from './pages/Inventaris/InventoryList';
import AddInventory from './pages/Inventaris/AddInventory';
import EditInventory from './pages/Inventaris/EditInventory';
import BulkImportInventory from "./pages/Inventaris/BulkImportInventory";
import InventoryTransaction from "./pages/Inventaris/InventoryTransaction";
import AddTransaction from './pages/Inventaris/AddTransaction';
import ReturnTransaction from './pages/Inventaris/ReturnTransaction';
import { startInactivityWatcher } from './utils/activityWatcher';

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
    if (token) {
      startInactivityWatcher();
    }
  }, [location, token, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/residents" element={<ProtectedRoute><Residents /></ProtectedRoute>} />
      <Route path="/residents/add" element={<ProtectedRoute><AddResident /></ProtectedRoute>} />
      <Route path="/residents/view/:id" element={<ProtectedRoute><EditResident /></ProtectedRoute>} />
      <Route path="/residents/edit/:id" element={<ProtectedRoute><EditResident /></ProtectedRoute>} />
      <Route path="/residents/import" element={<ProtectedRoute><BulkImportResidents /></ProtectedRoute>} />

      <Route path="/households" element={<ProtectedRoute><Households /></ProtectedRoute>} />
      <Route path="/households/edit/:kk_number" element={<ProtectedRoute><EditHousehold /></ProtectedRoute>} />
      <Route path="/households/add" element={<ProtectedRoute><AddHousehold /></ProtectedRoute>} />

      <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
      <Route path="/addresses/add" element={<ProtectedRoute><AddAddress /></ProtectedRoute>} />
      <Route path="/addresses/import" element={<ProtectedRoute><AddressBulkImport /></ProtectedRoute>} />
      <Route path="/addresses/edit/:id" element={<ProtectedRoute><EditAddress /></ProtectedRoute>} />

      <Route path="/report" element={<ProtectedRoute><ResidentReport /></ProtectedRoute>} />
      <Route path="/households/import" element={<ProtectedRoute><BulkImportHouseholds /></ProtectedRoute>} />
      <Route path="/address/import" element={<ProtectedRoute><BulkImportAddress /></ProtectedRoute>} />

      <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
      <Route path="/finance/add" element={<ProtectedRoute><AddFinance /></ProtectedRoute>} />
      <Route path="/finance/edit/:type/:id" element={<ProtectedRoute><EditFinance /></ProtectedRoute>} />
      <Route path="/finance/report" element={<ProtectedRoute><FinanceReport /></ProtectedRoute>} />
      <Route path="/finance/import" element={<ProtectedRoute><BulkImportFinance /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
      <Route path="/users/add" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
      <Route path="/users/edit/:id" element={<ProtectedRoute><EditUser /></ProtectedRoute>} />

      <Route path="/surat/:id" element={<ProtectedRoute><SuratPreviewPage /></ProtectedRoute>} />
      <Route path="/surat/" element={<ProtectedRoute><IntroLetterPage /></ProtectedRoute>} />
      <Route path="/surat/tambah" element={<ProtectedRoute><IntroLetterForm /></ProtectedRoute>} />

      <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
      <Route path="/inventory/add" element={<ProtectedRoute><AddInventory /></ProtectedRoute>} />
      <Route path="/inventory/edit/:id" element={<ProtectedRoute><EditInventory /></ProtectedRoute>} />
      <Route path="/import-inventory" element={<ProtectedRoute><BulkImportInventory /></ProtectedRoute>} />
      <Route path="/inventory-transaction" element={<ProtectedRoute><InventoryTransaction /></ProtectedRoute>} />
      <Route path="/inventory-transaction/add" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
      <Route path="/inventory-transaction/return/:id" element={<ProtectedRoute><ReturnTransaction /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
    </Routes>
  );
};

export default AppRoutes;
