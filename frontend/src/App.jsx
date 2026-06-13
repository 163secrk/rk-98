import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/Stores';
import StaffList from './pages/Staff';
import ClothingTypes from './pages/ClothingTypes';
import OrderList from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import Voucher from './pages/Voucher';
import Members from './pages/Members';
import Packages from './pages/Packages';
import Consumables from './pages/Consumables';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stores" element={<StoreList />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="clothing-types" element={<ClothingTypes />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="orders/voucher/:id" element={<Voucher />} />
        <Route path="members" element={<Members />} />
        <Route path="packages" element={<Packages />} />
        <Route path="consumables" element={<Consumables />} />
      </Route>
    </Routes>
  );
}

export default App;
