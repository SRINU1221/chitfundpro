import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getChits, reset } from '../features/chits/chitSlice';
import ChitCard from '../components/ChitCard';
import { Plus } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

function OrganizerDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chits, isLoading, isError, message } = useSelector((state) => state.chits);
    const { user } = useSelector((state) => state.auth);
    const [paymentStats, setPaymentStats] = useState({
        totalOnline: 0,
        totalCash: 0,
        totalCollected: 0,
        onlineCount: 0,
        cashCount: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        dispatch(getChits());

        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    // Fetch payment statistics for all chits
    useEffect(() => {
        const fetchPaymentStats = async () => {
            if (!chits || chits.length === 0 || !user) {
                setStatsLoading(false);
                return;
            }

            try {
                const token = user.token;
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                // Fetch statistics for each chit
                const statsPromises = chits.map(chit =>
                    axios.get(`${API_URL}/api/payments/chit/${chit._id}/statistics`, config)
                        .catch(() => ({ data: { totalOnline: 0, totalCash: 0, totalCollected: 0, onlineCount: 0, cashCount: 0 } }))
                );

                const statsResults = await Promise.all(statsPromises);

                // Aggregate statistics
                const aggregated = statsResults.reduce((acc, result) => ({
                    totalOnline: acc.totalOnline + (result.data.totalOnline || 0),
                    totalCash: acc.totalCash + (result.data.totalCash || 0),
                    totalCollected: acc.totalCollected + (result.data.totalCollected || 0),
                    onlineCount: acc.onlineCount + (result.data.onlineCount || 0),
                    cashCount: acc.cashCount + (result.data.cashCount || 0)
                }), {
                    totalOnline: 0,
                    totalCash: 0,
                    totalCollected: 0,
                    onlineCount: 0,
                    cashCount: 0
                });

                setPaymentStats(aggregated);
                setStatsLoading(false);
            } catch (error) {
                console.error('Error fetching payment statistics:', error);
                setStatsLoading(false);
            }
        };

        if (!isLoading && chits.length > 0) {
            fetchPaymentStats();
        }
    }, [chits, isLoading, user]);

    const handleCreateChit = () => {
        console.log('Navigating to create-chit...');
        dispatch(reset()); // Reset state before navigating
        navigate('/create-chit');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Organizer Dashboard</h1>
                    <p className="text-slate-500">Manage your chit groups and auctions</p>
                </div>
                <button
                    onClick={handleCreateChit}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full md:w-auto"
                >
                    <Plus size={20} className="mr-1" />
                    Create New Chit
                </button>
            </div>

            {/* Stats Section Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Active Chits</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{chits.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Participants</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                        {chits.reduce((acc, chit) => acc + chit.members.length, 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Pool Value (Monthly)</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        ₹{chits.reduce((acc, chit) => acc + (chit.monthlyContribution * chit.totalMembers), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Commission (Monthly)</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        ₹{chits.reduce((acc, chit) => acc + (chit.commission || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Chit Groups</h2>

            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : isError ? (
                <div className="text-center text-red-500 py-10">{message}</div>
            ) : chits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chits.map((chit) => (
                        <ChitCard key={chit._id} chit={chit} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500 text-lg">You haven't created any chit groups yet.</p>
                    <Link to="/create-chit" className="text-blue-600 hover:underline mt-2 inline-block">
                        Create your first chit
                    </Link>
                </div>
            )}
        </div>
    );
}

export default OrganizerDashboard;
