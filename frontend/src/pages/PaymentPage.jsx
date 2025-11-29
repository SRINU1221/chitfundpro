import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { CreditCard, CheckCircle, Clock, Users } from 'lucide-react';

function PaymentPage() {
    const { user } = useSelector((state) => state.auth);
    const [transactions, setTransactions] = useState([]);
    const [organizerStats, setOrganizerStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = user.token;
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                // Fetch my transactions
                const myResponse = await axios.get('http://localhost:5000/api/payments/my', config);
                setTransactions(myResponse.data);

                // Fetch organizer stats
                const orgResponse = await axios.get('http://localhost:5000/api/payments/organizer', config);
                setOrganizerStats(orgResponse.data);

                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Payments & History</h1>
            <p className="text-slate-500 mb-8">Track your contributions and dividends</p>

            {/* Organizer Overview Section */}
            {organizerStats && organizerStats.totalCollected > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2 text-purple-600" /> Organizer Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-medium">Total Collected from Members</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">
                                        ₹{organizerStats.totalCollected.toLocaleString()}
                                    </p>
                                </div>
                                <Users className="text-purple-500" size={32} />
                            </div>
                        </div>
                    </div>

                    {organizerStats.recentTransactions.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-semibold text-slate-700">Recent Member Payments</h3>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chit Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {organizerStats.recentTransactions.slice(0, 5).map((t) => (
                                        <tr key={t._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {t.user?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {t.chit?.name || 'Unknown Chit'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                +₹{t.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Transaction History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500 uppercase font-medium">Total Paid</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">
                                ₹{transactions
                                    .filter(t => t.type === 'payment' && t.status === 'completed')
                                    .reduce((acc, t) => acc + (t.totalAmount || 0), 0)
                                    .toLocaleString()}
                            </p>
                        </div>
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500 uppercase font-medium">Total Received (Dividends)</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">
                                ₹{transactions
                                    .filter(t => t.type === 'dividend')
                                    .reduce((acc, t) => acc + (t.totalAmount || 0), 0)
                                    .toLocaleString()}
                            </p>
                        </div>
                        <DollarSign className="text-blue-500" size={32} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chit Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {transactions.map((t) => (
                            <tr key={t._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    {t.chit?.name || 'Unknown Chit'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {t.type === 'payment' ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.paymentMode === 'cash'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {(t.paymentMode || 'online').toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            {t.type.toUpperCase()}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                    ₹{t.totalAmount?.toLocaleString() || '0'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No transactions found.</div>
                )}
            </div>
        </div>
    );
}

// Helper component for icon
function DollarSign({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    );
}

export default PaymentPage;
