import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getChitTransactions, reset } from '../features/payments/paymentSlice';
import { ArrowLeft } from 'lucide-react';

function ChitTransactions() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { chitTransactions, isLoading, isError, message } = useSelector((state) => state.payment);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isError) {
            console.error(message);
        }

        if (!user) {
            navigate('/login');
        } else {
            dispatch(getChitTransactions(id));
        }

        return () => {
            dispatch(reset());
        };
    }, [user, navigate, isError, message, dispatch, id]);

    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-500 hover:text-slate-700 mb-6"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Chit Details
            </button>

            <h1 className="text-3xl font-bold text-slate-800 mb-6">Transaction History</h1>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chit Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment (Month)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {chitTransactions.map((t) => (
                            <tr key={t._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {t.chit?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{t.user?.name || 'Unknown'}</div>
                                    <div className="text-sm text-slate-500">{t.user?.email}</div>
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
                                    ₹{(t.totalAmount || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {t.type === 'payment' ? `Month ${t.month}` : '-'}
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
                {chitTransactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No transactions found for this chit.</div>
                )}
            </div>
        </div>
    );
}

export default ChitTransactions;
