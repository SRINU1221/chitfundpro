import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { joinChit, updateMemberStatus, reset, getChit, startChit } from '../features/chits/chitSlice';
import { getChitTransactions, getMyTransactions } from '../features/payments/paymentSlice';
import chitService from '../features/chits/chitService';
import axios from 'axios';
import { Users, Calendar, DollarSign, CheckCircle, XCircle, Play, Edit, Trash2 } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-toastify';
import API_URL from '../config';

function ChitDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { chitTransactions, transactions } = useSelector((state) => state.payment);
    const { chit } = useSelector((state) => state.chits);

    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [monthPaymentStatus, setMonthPaymentStatus] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const membersPerPage = 10;
    const [paymentStats, setPaymentStats] = useState({
        totalOnline: 0,
        totalCash: 0,
        totalCollected: 0,
        onlineCount: 0,
        cashCount: 0,
        month: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        confirmText: 'Confirm'
    });

    useEffect(() => {
        const fetchData = async () => {
            const action = await dispatch(getChit(id));
            const fetchedChit = action.payload;

            if (user) {
                // Fetch my transactions to check payment status
                await dispatch(getMyTransactions());

                // If organizer, fetch all chit transactions
                if (fetchedChit && fetchedChit.organizer === user._id) {
                    await dispatch(getChitTransactions(id));

                    // Fetch current month payment status
                    if (fetchedChit.status === 'active') {
                        try {
                            const config = {
                                headers: {
                                    Authorization: `Bearer ${user.token}`,
                                },
                            };
                            // Get the next month to check (based on lifts)
                            const liftsRes = await axios.get(`${API_URL}/api/lifts/chit/${id}/history`, config);
                            const currentMonth = liftsRes.data.length + 1;

                            if (currentMonth <= fetchedChit.totalMonths) {
                                const statusRes = await axios.get(
                                    `${API_URL}/api/lifts/chit/${id}/month/${currentMonth}/status`,
                                    config
                                );
                                setMonthPaymentStatus(statusRes.data);
                            }

                            // Payment statistics are now fetched in a separate useEffect

                        } catch (error) {
                            console.error('Error fetching payment status:', error);
                            setStatsLoading(false);
                        }
                    }
                }
            }
            setLoading(false);
        };

        if (user) {
            fetchData();
        } else {
            navigate('/login');
        }

        return () => {
            dispatch(reset());
        };
    }, [id, user, navigate, dispatch]);

    // Separate useEffect to refetch payment statistics when month changes
    useEffect(() => {
        const fetchPaymentStats = async () => {
            if (!chit || !user || chit.status !== 'active' || chit.organizer !== user._id) {
                return;
            }

            setStatsLoading(true);
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                const statsRes = await axios.get(
                    `${API_URL}/api/payments/chit/${id}/statistics?t=${Date.now()}`,
                    config
                );
                setPaymentStats(statsRes.data);
                setStatsLoading(false);
            } catch (error) {
                console.error('Error fetching payment statistics:', error);
                setStatsLoading(false);
            }
        };

        fetchPaymentStats();
    }, [chit?.currentMonth, id, user, chit?.status, chit?.organizer]);

    const onJoin = () => {
        dispatch(joinChit(id));
        toast.success('Joined group successfully');
        setTimeout(() => {
            dispatch(getChit(id));
        }, 500);
    };

    const handleStatusUpdate = (userId, status) => {
        dispatch(updateMemberStatus({ chitId: id, userId, status }));
        // Refetch chit data instead of reloading the page
        setTimeout(() => {
            dispatch(getChit(id));
        }, 500);
    };

    const onStartChit = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Start Chit Group',
            message: 'Are you sure you want to start this chit? This action cannot be undone and will enable payment collection.',
            confirmText: 'Start Chit',
            isDanger: false,
            onConfirm: () => {
                dispatch(startChit(id));
                toast.success('Chit started successfully!');
                setTimeout(() => {
                    dispatch(getChit(id));
                }, 500);
            }
        });
    };

    const onDeleteChit = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Chit Group',
            message: 'Are you sure you want to delete this chit? All related data will be permanently deleted. This action cannot be undone.',
            confirmText: 'Delete Chit',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await chitService.deleteChit(id, user.token);
                    toast.success('Chit deleted successfully');
                    navigate('/dashboard');
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Error deleting chit');
                }
            }
        });
    };

    const onRemoveMember = async (userId, memberName) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Member',
            message: `Are you sure you want to remove ${memberName} from this chit?`,
            confirmText: 'Remove',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await chitService.removeMember(id, userId, user.token);
                    toast.success(`${memberName} removed successfully`);
                    dispatch(getChit(id));
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Error removing member');
                }
            }
        });
    };


    if (loading) return <div className="text-center mt-20">Loading...</div>;
    if (!chit) return <div className="text-center mt-20">Chit not found</div>;
    if (!user) return <div className="text-center mt-20">Please login to view chit details</div>;

    const isMember = chit.members.some(m => m.user && m.user._id === user._id);
    const isOrganizer = chit.organizer === user._id;

    // Check if current user has paid for month 1
    const hasPaid = transactions.some(t =>
        (t.chit._id === chit._id || t.chit === chit._id) &&
        t.month === 1 &&
        t.type === 'payment'
    );

    // Calculate dynamic pool and payout
    const currentMonth = chit.currentMonth || 1;
    const previousLiftersCount = chit.lifts ? chit.lifts.filter(l => l.month < currentMonth).length : 0;
    const extraCollection = previousLiftersCount * (chit.extraChargePerMonth || 0);
    const baseCollection = chit.monthlyContribution * chit.totalMembers;
    const totalPool = baseCollection + extraCollection;
    const commission = chit.commission || 0;
    const lifterPayout = totalPool - commission;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-slate-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{chit.name}</h1>
                        <p className="text-blue-300 mt-1">Status: {chit.status.toUpperCase()}</p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-3xl font-bold">₹{lifterPayout.toLocaleString()}</p>
                        <p className="text-sm opacity-80">Est. Lifter Payout (Month {currentMonth})</p>
                        {isOrganizer && (
                            <p className="text-xs text-green-300 mt-1">
                                Pool: ₹{totalPool.toLocaleString()} | Comm: ₹{commission.toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <Calendar size={24} className="text-blue-600 mr-4" />
                            <div>
                                <p className="text-sm text-slate-500">Duration</p>
                                <p className="text-lg font-bold text-slate-800">{chit.totalMonths} Months</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <Users size={24} className="text-blue-600 mr-4" />
                            <div>
                                <p className="text-sm text-slate-500">Members</p>
                                <p className="text-lg font-bold text-slate-800">{chit.members.length} / {chit.totalMembers}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <DollarSign size={24} className="text-blue-600 mr-4" />
                            <div>
                                <p className="text-sm text-slate-500">Monthly Contribution</p>
                                <p className="text-lg font-bold text-slate-800">₹{chit.monthlyContribution.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Collection Overview - Only for Organizer and Active Chits */}
                    {isOrganizer && chit.status === 'active' && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Payment Collection Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-blue-700 text-sm font-medium uppercase">Online Payments</h3>
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    {statsLoading ? (
                                        <p className="text-xl font-bold text-blue-900">Loading...</p>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold text-blue-900">₹{paymentStats.totalOnline.toLocaleString()}</p>
                                            <p className="text-xs text-blue-600 mt-1">{paymentStats.onlineCount} transaction{paymentStats.onlineCount !== 1 ? 's' : ''}</p>
                                        </>
                                    )}
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-green-700 text-sm font-medium uppercase">Cash Payments</h3>
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    {statsLoading ? (
                                        <p className="text-xl font-bold text-green-900">Loading...</p>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold text-green-900">₹{paymentStats.totalCash.toLocaleString()}</p>
                                            <p className="text-xs text-green-600 mt-1">{paymentStats.cashCount} transaction{paymentStats.cashCount !== 1 ? 's' : ''}</p>
                                        </>
                                    )}
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-purple-700 text-sm font-medium uppercase">Total Collected</h3>
                                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    {statsLoading ? (
                                        <p className="text-xl font-bold text-purple-900">Loading...</p>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold text-purple-900">₹{paymentStats.totalCollected.toLocaleString()}</p>
                                            <p className="text-xs text-purple-600 mt-1">{paymentStats.onlineCount + paymentStats.cashCount} total transaction{(paymentStats.onlineCount + paymentStats.cashCount) !== 1 ? 's' : ''}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-slate-800">Participants</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {isOrganizer && (
                                <>
                                    <button
                                        onClick={() => navigate(`/chits/${id}/edit`)}
                                        className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition flex items-center"
                                    >
                                        <Edit size={18} className="mr-2" /> Edit
                                    </button>
                                    <button
                                        onClick={onDeleteChit}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
                                    >
                                        <Trash2 size={18} className="mr-2" /> Delete
                                    </button>
                                </>
                            )}
                            {isOrganizer && chit.status === 'active' && (
                                <div className="flex items-center space-x-4">
                                    {monthPaymentStatus && (
                                        <div className="text-sm">
                                            {monthPaymentStatus.readyForLiftSelection ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                                    ✓ Ready ({monthPaymentStatus.paidCount}/{monthPaymentStatus.totalMembers} paid)
                                                </span>
                                            ) : monthPaymentStatus.lifterSelected ? (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                                                    Lifter Selected
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                                                    Collecting ({monthPaymentStatus.paidCount}/{monthPaymentStatus.totalMembers} paid)
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => navigate(`/chits/${id}/lift-selection`)}
                                        disabled={monthPaymentStatus && !monthPaymentStatus.readyForLiftSelection && !monthPaymentStatus.lifterSelected}
                                        className={`px-6 py-2 rounded-md transition ${monthPaymentStatus && !monthPaymentStatus.readyForLiftSelection && !monthPaymentStatus.lifterSelected
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                            }`}
                                        title={monthPaymentStatus && !monthPaymentStatus.readyForLiftSelection && !monthPaymentStatus.lifterSelected
                                            ? `Waiting for ${monthPaymentStatus.totalMembers - monthPaymentStatus.paidCount} more payment(s)`
                                            : 'Manage monthly cycle'}
                                    >
                                        {monthPaymentStatus && monthPaymentStatus.lifterSelected ? 'Complete Month' : 'Select Lifter'}
                                    </button>
                                </div>
                            )}

                            {isOrganizer && chit.status === 'open' && (
                                <button
                                    onClick={onStartChit}
                                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition flex items-center"
                                >
                                    <Play size={18} className="mr-2" /> Start Chit
                                </button>
                            )}

                            {!isMember && !isOrganizer && chit.status === 'open' && (
                                <button
                                    onClick={onJoin}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Join Group
                                </button>
                            )}

                            {isMember && !isOrganizer && chit.status === 'active' && (
                                <button
                                    onClick={() => navigate(`/chits/${id}/payment-dashboard`)}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition shadow-md"
                                >
                                    Payment Dashboard
                                </button>
                            )}

                            {isMember && !isOrganizer && chit.status === 'open' && (
                                <div className="text-slate-500 text-sm italic px-4 py-2 border border-slate-200 rounded-md bg-slate-50">
                                    Payments start when active
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined Date</th>

                                    {isOrganizer && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {chit.members.filter(m => m.user).slice((currentPage - 1) * membersPerPage, currentPage * membersPerPage).map((member) => (
                                    <tr key={member._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{member.user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-500">{member.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(member.joinedAt).toLocaleDateString()}
                                        </td>

                                        {isOrganizer && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {member.status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(member.user._id, 'approved')}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(member.user._id, 'rejected')}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                                {member.status === 'approved' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => navigate(`/payments/chit/${id}`)}
                                                            className="text-blue-600 hover:text-blue-900 text-xs"
                                                        >
                                                            View History
                                                        </button>
                                                        <button
                                                            onClick={() => onRemoveMember(member.user._id, member.user.name)}
                                                            className="text-red-600 hover:text-red-900 text-xs"
                                                            title="Remove Member"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {chit.members.filter(m => m.user).length > membersPerPage && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(chit.members.filter(m => m.user).length / membersPerPage)))}
                                    disabled={currentPage === Math.ceil(chit.members.filter(m => m.user).length / membersPerPage)}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700">
                                        Showing <span className="font-medium">{(currentPage - 1) * membersPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * membersPerPage, chit.members.filter(m => m.user).length)}</span> of <span className="font-medium">{chit.members.filter(m => m.user).length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        {[...Array(Math.ceil(chit.members.filter(m => m.user).length / membersPerPage)).keys()].map(number => (
                                            <button
                                                key={number + 1}
                                                onClick={() => setCurrentPage(number + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number + 1
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {number + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(chit.members.filter(m => m.user).length / membersPerPage)))}
                                            disabled={currentPage === Math.ceil(chit.members.filter(m => m.user).length / membersPerPage)}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                chit={chit}
                amount={chit.monthlyContribution}
                month={1}
                onSuccess={() => dispatch(getChit(id))}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
}

export default ChitDetails;
