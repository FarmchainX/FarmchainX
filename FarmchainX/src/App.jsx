import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import FarmerLayout from './farmer/FarmerLayout';
import FarmerDashboard from './farmer/FarmerDashboard';
import AddCropBatchPage from './farmer/AddCropBatchPage';
import FarmerProductsPage from './farmer/FarmerProductsPage';
import FarmerOrdersPage from './farmer/FarmerOrdersPage';
import FarmerBlockchainPage from './farmer/FarmerBlockchainPage';
import FarmerPaymentsPage from './farmer/FarmerPaymentsPage';
import FarmerHelpPage from './farmer/FarmerHelpPage';
import FarmerSettingsPage from './farmer/FarmerSettingsPage';
import FarmerAIInsightsPage from './farmer/FarmerAIInsightsPage';
import DeliveryLayout from './delivery/DeliveryLayout';
import DeliveryDashboardPage from './delivery/DeliveryDashboardPage';
import DeliveryAvailablePage from './delivery/DeliveryAvailablePage';
import DeliveryMyDeliveriesPage from './delivery/DeliveryMyDeliveriesPage';
import DeliveryDetailsPage from './delivery/DeliveryDetailsPage';
import DeliveryHistoryPage from './delivery/DeliveryHistoryPage';
import DeliveryEarningsPage from './delivery/DeliveryEarningsPage';
import DeliveryNotificationsPage from './delivery/DeliveryNotificationsPage';
import DeliveryProfilePage from './delivery/DeliveryProfilePage';
import DeliverySettingsPage from './delivery/DeliverySettingsPage';
import CustomerLayout from './customer/CustomerLayout';
import CustomerHomePage from './customer/CustomerHomePage';
import CustomerShopPage from './customer/CustomerShopPage';
import CustomerProductDetailsPage from './customer/CustomerProductDetailsPage';
import CustomerOrdersPage from './customer/CustomerOrdersPage';
import CustomerScanQrPage from './customer/CustomerScanQrPage';
import CustomerCartPage from './customer/CustomerCartPage';
import CustomerProfilePage from './customer/CustomerProfilePage';
import CustomerOrderPlacedPage from './customer/CustomerOrderPlacedPage';
import AdminLoginPage from './admin/AdminLoginPage.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminDashboardPage from './admin/AdminDashboardPage.jsx';
import AdminFarmersPage from './admin/AdminFarmersPage.jsx';
import AdminCustomersPage from './admin/AdminCustomersPage.jsx';
import AdminDeliveryPartnersPage from './admin/AdminDeliveryPartnersPage.jsx';
import AdminBlockchainLogsPage from './admin/AdminBlockchainLogsPage.jsx';
import AdminTransactionsPage from './admin/AdminTransactionsPage.jsx';
import AdminDisputesPage from './admin/AdminDisputesPage.jsx';
import AdminReportsPage from './admin/AdminReportsPage.jsx';
import AdminNotificationsPage from './admin/AdminNotificationsPage.jsx';
import AdminSettingsPage from './admin/AdminSettingsPage.jsx';
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/farmer" element={<FarmerLayout />}>
        <Route index element={<FarmerDashboard />} />
        <Route path="batches" element={<AddCropBatchPage />} />
        <Route path="products" element={<FarmerProductsPage />} />
        <Route path="orders" element={<FarmerOrdersPage />} />
        <Route path="blockchain" element={<FarmerBlockchainPage />} />
        <Route path="payments" element={<FarmerPaymentsPage />} />
        <Route path="ai" element={<FarmerAIInsightsPage />} />
        <Route path="help" element={<FarmerHelpPage />} />
        <Route path="settings" element={<FarmerSettingsPage />} />
      </Route>
      <Route path="/delivery" element={<DeliveryLayout />}>
        <Route index element={<DeliveryDashboardPage />} />
        <Route path="available" element={<DeliveryAvailablePage />} />
        <Route path="my-deliveries" element={<DeliveryMyDeliveriesPage />} />
        <Route path="details/:id" element={<DeliveryDetailsPage />} />
        <Route path="history" element={<DeliveryHistoryPage />} />
        <Route path="earnings" element={<DeliveryEarningsPage />} />
        <Route path="notifications" element={<DeliveryNotificationsPage />} />
        <Route path="profile" element={<DeliveryProfilePage />} />
        <Route path="settings" element={<DeliverySettingsPage />} />
      </Route>
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="shop" element={<CustomerShopPage />} />
        <Route path="shop/:id" element={<CustomerProductDetailsPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="scan" element={<CustomerScanQrPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="order-success" element={<CustomerOrderPlacedPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="farmers" element={<AdminFarmersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="delivery-partners" element={<AdminDeliveryPartnersPage />} />
        <Route path="blockchain-logs" element={<AdminBlockchainLogsPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
