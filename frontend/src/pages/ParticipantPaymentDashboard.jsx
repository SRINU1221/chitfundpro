import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { CheckCircle, Lock, CreditCard, Calendar, DollarSign } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import API_URL from '../config';

function ParticipantPaymentDashboard() {
    const { id } = useParams(); // Chit ID
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [chit, setChit] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [currentDue, setCurrentDue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            // Fetch chit details
            const chitRes = await axios.get(`${API_URL}/api/chits/${id}`, config);
            setChit(chitRes.data);

            // Fetch payment history
            const historyRes = await axios.get(`${API_URL}/api/payments/chit/${id}/history`, config);
            setPaymentHistory(historyRes.data);

            // Fetch current due
            const dueRes = await axios.get(`${API_URL}/api/payments/chit/${id}/current-due`, config);
            setCurrentDue(dueRes.data);

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            navigate('/login');
        }
    }, [id, user, navigate]);

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        fetchData(); // Refresh data
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;
    if (!chit) return <div className="text-center mt-20">Chit not found</div>;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center">
                    <CheckCircle size={14} className="mr-1" /> Paid
                </span>;
            case 'due':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center">
                    <CreditCard size={14} className="mr-1" /> Current Due
                </span>;
            case 'locked':
                return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold flex items-center">
                    <Lock size={14} className="mr-1" /> Locked
                </span>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Payment Dashboard</h1>
                        <p className="text-slate-500 mt-1">Chit Group: {chit.name}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/chits/${id}`)}
                        className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition w-full md:w-auto"
                    >
                        Back to Chit Details
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Months</p>
                                <p className="text-2xl font-bold text-slate-800">{chit.totalMonths}</p>
                            </div>
                            <Calendar className="text-blue-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Paid Months</p>
                                <p className="text-2xl font-bold text-slate-800">{currentDue?.paidMonths || 0}</p>
                            </div>
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Current Monthly Due</p>
                                <p className="text-2xl font-bold text-slate-800">₹{currentDue?.totalAmount?.toLocaleString() || chit.monthlyContribution.toLocaleString()}</p>
                                {currentDue?.hasLifted && (
                                    <p className="text-xs text-orange-600 mt-1">Includes ₹{chit.extraChargePerMonth.toLocaleString()} extra</p>
                                )}
                            </div>
                            <DollarSign className="text-yellow-500" size={32} />
                        </div>
                    </div>
                </div>

                {/* Lift Status Alert */}
                {currentDue?.hasLifted && (
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6 rounded-lg">
                        <div className="flex items-center">
                            <div className="bg-orange-100 p-2 rounded-full mr-3">
                                <DollarSign className="text-orange-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-orange-800">You have lifted in Month {currentDue.liftedInMonth}</h3>
                                <p className="text-orange-700 text-sm">You now pay ₹{chit.extraChargePerMonth.toLocaleString()} extra per month for remaining months</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Due Alert */}
                {currentDue && !currentDue.allPaid && currentDue.currentMonth && currentDue.totalAmount && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                    Month {currentDue.currentMonth} Payment Due
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-yellow-700">Regular Amount: ₹{currentDue.regularAmount?.toLocaleString()}</p>
                                    {currentDue.extraAmount > 0 && (
                                        <p className="text-orange-700 font-semibold">Extra Charge: ₹{currentDue.extraAmount?.toLocaleString()}</p>
                                    )}
                                    <p className="text-yellow-800 font-bold text-lg">Total Due: ₹{currentDue.totalAmount?.toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition font-semibold"
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Up to Date Message - when user has paid all months up to current month */}
                {currentDue && !currentDue.allPaid && currentDue.upToDate && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 rounded-lg">
                        <div className="flex items-center">
                            <CheckCircle className="text-blue-600 mr-3" size={24} />
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800">You're All Caught Up!</h3>
                                <p className="text-blue-700">You've paid all months up to the current month. No payment due at this time.</p>
                            </div>
                        </div>
                    </div>
                )}

                {currentDue?.allPaid && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8 rounded-lg">
                        <div className="flex items-center">
                            <CheckCircle className="text-green-600 mr-3" size={24} />
                            <div>
                                <h3 className="text-lg font-semibold text-green-800">All Payments Completed!</h3>
                                <p className="text-green-700">You have successfully paid all {chit.totalMonths} months.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment History Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Month</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Regular</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Extra</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {paymentHistory.map((payment) => (
                                    <tr key={payment.month} className={payment.status === 'due' ? 'bg-yellow-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            Month {payment.month}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            ₹{chit.monthlyContribution.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 font-semibold">
                                            {payment.extraAmount > 0 ? `₹${payment.extraAmount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {payment.date ? new Date(payment.date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                            {payment.transactionId ? payment.transactionId.slice(-8) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {payment.status === 'due' && (
                                                <button
                                                    onClick={() => setIsPaymentModalOpen(true)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-xs font-semibold"
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                            {payment.status === 'locked' && (
                                                <span className="text-gray-400 text-xs">Pay previous months first</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {currentDue && !currentDue.allPaid && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    chit={chit}
                    amount={currentDue.totalAmount}
                    month={currentDue.currentMonth}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}

export default ParticipantPaymentDashboard;
