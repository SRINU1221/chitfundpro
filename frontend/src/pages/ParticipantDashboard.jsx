import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getChits, reset } from '../features/chits/chitSlice';
import { getMyTransactions } from '../features/payments/paymentSlice';
import ChitCard from '../components/ChitCard';
import PaymentModal from '../components/PaymentModal';

function ParticipantDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chits, isLoading, isError, message } = useSelector((state) => state.chits);
    const { user } = useSelector((state) => state.auth);
    const { transactions } = useSelector((state) => state.payment);

    const [selectedChit, setSelectedChit] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        dispatch(getChits());
        dispatch(getMyTransactions());

        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    // Filter chits where user is a member
    const myChits = chits.filter(chit =>
        chit.members.some(member => member.user === user._id)
    );

    const availableChits = chits.filter(chit =>
        (chit.status === 'open' || chit.status === 'active') &&
        !chit.members.some(member => member.user === user._id) &&
        chit.members.length < chit.totalMembers
    );

    // Calculate totals
    const totalInvestment = transactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((acc, t) => acc + (t.totalAmount || 0), 0);

    const nextDue = myChits.reduce((acc, chit) => {
        // Check if payment exists for this chit and month 1 (hardcoded for now)
        const hasPaid = transactions.some(t =>
            (t.chit._id === chit._id || t.chit === chit._id) &&
            t.month === 1 &&
            t.type === 'payment'
        );
        return acc + (hasPaid ? 0 : chit.monthlyContribution);
    }, 0);

    const totalPayable = myChits.reduce((acc, chit) => acc + (chit.monthlyContribution * chit.totalMonths), 0);
    const remainingAmount = totalPayable - totalInvestment;

    const openPaymentModal = (chit) => {
        setSelectedChit(chit);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
                <p className="text-slate-500">Track your investments and payments</p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Joined Chits</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{myChits.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Investment</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">₹{totalInvestment.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Remaining</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">₹{remainingAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Next Due</h3>
                    <p className="text-3xl font-bold text-red-500 mt-2">
                        ₹{nextDue.toLocaleString()}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6">My Active Chits</h2>
            {myChits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {myChits.map((chit) => {
                        const hasPaid = transactions.some(t =>
                            (t.chit._id === chit._id || t.chit === chit._id) &&
                            t.month === 1 &&
                            t.type === 'payment'
                        );

                        return (
                            <div key={chit._id}>
                                <ChitCard chit={chit}>
                                    {chit.status === 'active' && !hasPaid && (
                                        <button
                                            onClick={() => openPaymentModal(chit)}
                                            className="flex-1 bg-green-800 text-white px-4 py-2 rounded-md hover:bg-green-900 transition shadow-sm hover:shadow-md font-medium"
                                        >
                                            Pay Amount
                                        </button>
                                    )}
                                    {chit.status === 'active' && hasPaid && (
                                        <button
                                            onClick={() => navigate(`/chits/${chit._id}/payment-dashboard`)}
                                            className="flex-1 bg-green-800 text-white px-4 py-2 rounded-md hover:bg-green-900 transition shadow-sm hover:shadow-md font-medium flex items-center justify-center cursor-pointer"
                                        >
                                            Pay Amount
                                        </button>
                                    )}
                                </ChitCard>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center mb-12">
                    <p className="text-slate-500">You haven't joined any chits yet.</p>
                </div>
            )}

            <h2 className="text-2xl font-bold text-slate-800 mb-6">Available Chits to Join</h2>
            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : isError ? (
                <div className="text-center text-red-500 py-10">{message}</div>
            ) : availableChits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableChits.map((chit) => (
                        <ChitCard key={chit._id} chit={chit} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">No new chits available at the moment.</p>
                </div>
            )}

            {selectedChit && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    chit={selectedChit}
                    amount={selectedChit.monthlyContribution}
                    month={1} // Defaulting to month 1 for now, logic can be improved
                    onSuccess={() => {
                        dispatch(getChits());
                        dispatch(getMyTransactions());
                    }}
                />
            )}
        </div>
    );
}

export default ParticipantDashboard;
