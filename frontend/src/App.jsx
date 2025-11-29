import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateChit from './pages/CreateChit';
import EditChit from './pages/EditChit';
import ChitDetails from './pages/ChitDetails';
import LiftSelection from './pages/LiftSelection';
import PaymentPage from './pages/PaymentPage';
import ChitTransactions from './pages/ChitTransactions';
import ParticipantPaymentDashboard from './pages/ParticipantPaymentDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-chit" element={<CreateChit />} />
            <Route path="/chits/:id" element={<ChitDetails />} />
            <Route path="/chits/:id/edit" element={<EditChit />} />
            <Route path="/chits/:id/lift-selection" element={<LiftSelection />} />
            <Route path="/chits/:id/payment-dashboard" element={<ParticipantPaymentDashboard />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/payments/chit/:id" element={<ChitTransactions />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
