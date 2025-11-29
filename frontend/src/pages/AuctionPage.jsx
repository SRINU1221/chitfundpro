import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Trophy, Users, Calculator } from 'lucide-react';

function AuctionPage() {
    const { id } = useParams(); // Chit ID
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [distributions, setDistributions] = useState([]);
    const [chit, setChit] = useState(null);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [month, setMonth] = useState('');
    const [winnerId, setWinnerId] = useState('');
    const [calculatedAmount, setCalculatedAmount] = useState(null);

    const fetchData = async () => {
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const chitRes = await axios.get(`http://localhost:5000/api/chits/${id}`, config);
            setChit(chitRes.data);

            const distributionRes = await axios.get(`http://localhost:5000/api/auctions/chit/${id}`, config);
            setDistributions(distributionRes.data);

            // Fetch available members if organizer
            if (chitRes.data.organizer === user._id) {
                const membersRes = await axios.get(`http://localhost:5000/api/auctions/chit/${id}/available-members`, config);
                setAvailableMembers(membersRes.data);
            }

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

    // Calculate amount when month changes
    useEffect(() => {
        if (month && chit) {
            // Calculate interest dynamically
            const approvedMembers = chit.members.filter(m => m.status === 'approved');
            const totalMembers = approvedMembers.length;

            if (totalMembers > 0) {
                const interestPerMonth = chit.amount / (totalMembers * chit.months);
                const remainingMonths = chit.months - Number(month) + 1;
                const deduction = interestPerMonth * remainingMonths;
                const amount = chit.amount - deduction;

                setCalculatedAmount({
                    amount,
                    deduction,
                    remainingMonths,
                    interestPerMonth,
                    totalMembers,
                });
            } else {
                setCalculatedAmount(null);
            }
        } else {
            setCalculatedAmount(null);
        }
    }, [month, chit]);

    const onSelectWinner = async (e) => {
        e.preventDefault();
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.post('http://localhost:5000/api/auctions/select-winner', {
                chitId: id,
                month: Number(month),
                winnerId,
            }, config);

            fetchData();
            setMonth('');
            setWinnerId('');
            setCalculatedAmount(null);
            alert('Winner selected successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error selecting winner');
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    const isOrganizer = chit.organizer === user._id;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Monthly Distribution</h1>
            <p className="text-slate-500 mb-8">Chit Group: {chit.name}</p>

            {/* Chit Info */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-600">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-800">₹{chit.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Duration</p>
                        <p className="text-2xl font-bold text-slate-800">{chit.months} Months</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Approved Members</p>
                        <p className="text-2xl font-bold text-slate-800">{chit.members.filter(m => m.status === 'approved').length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Winners Selected</p>
                        <p className="text-2xl font-bold text-slate-800">{distributions.length} / {chit.months}</p>
                    </div>
                </div>
            </div>

            {/* Organizer Controls */}
            {isOrganizer && availableMembers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2" /> Select Monthly Winner
                    </h2>
                    <form onSubmit={onSelectWinner} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Month</option>
                                    {Array.from({ length: chit.months }, (_, i) => i + 1)
                                        .filter(m => !distributions.some(d => d.month === m))
                                        .map(m => (
                                            <option key={m} value={m}>Month {m}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Winner</label>
                                <select
                                    value={winnerId}
                                    onChange={(e) => setWinnerId(e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {availableMembers.map(member => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} ({member.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {calculatedAmount && (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                    <Calculator className="text-green-600 mr-2" size={20} />
                                    <h3 className="font-semibold text-slate-800">Calculated Amount</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-600">Remaining Months</p>
                                        <p className="text-lg font-bold text-slate-800">{calculatedAmount.remainingMonths}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600">Deduction</p>
                                        <p className="text-lg font-bold text-red-600">-₹{calculatedAmount.deduction.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600">Amount to Receive</p>
                                        <p className="text-lg font-bold text-green-600">₹{calculatedAmount.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Formula: ₹{chit.amount.toLocaleString()} - (₹{calculatedAmount.interestPerMonth.toFixed(2)} × {calculatedAmount.remainingMonths})
                                    <br />
                                    Interest/Month = Total Amount / (Approved Members × Months) = ₹{chit.amount.toLocaleString()} / ({calculatedAmount.totalMembers} × {chit.months})
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            disabled={!month || !winnerId}
                        >
                            Confirm Winner Selection
                        </button>
                    </form>
                </div>
            )}

            {isOrganizer && availableMembers.length === 0 && distributions.length < chit.months && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8 text-center">
                    <p className="text-yellow-800">All approved members have already won. Approve more members to continue.</p>
                </div>
            )}

            {/* Distribution History */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Distribution History</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Winner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Received</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deduction</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {distributions.map((dist) => (
                            <tr key={dist._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Month {dist.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                    {dist.winner ? (
                                        <div className="flex items-center">
                                            <Trophy size={16} className="text-yellow-500 mr-2" />
                                            {dist.winner.name}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                    ₹{dist.amountReceived?.toLocaleString() || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                    -₹{dist.deduction?.toLocaleString() || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(dist.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {distributions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No winners selected yet.</div>
                )}
            </div>
        </div>
    );
}

export default AuctionPage;
