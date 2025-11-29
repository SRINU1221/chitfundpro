import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

import { Users, DollarSign, TrendingUp, CheckCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import API_URL from '../config';

function LiftSelection() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [chit, setChit] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(1);
    const [monthStatus, setMonthStatus] = useState(null);
    const [selectedMember, setSelectedMember] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lifterSelected, setLifterSelected] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    const [advancing, setAdvancing] = useState(false);

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

                // Calculate current month based on lifts
                const liftsRes = await axios.get(`${API_URL}/api/lifts/chit/${id}/history`, config);
                const nextMonth = liftsRes.data.length + 1;
                setCurrentMonth(nextMonth);

                // Fetch month status
                if (nextMonth <= chitRes.data.totalMonths) {
                    const statusRes = await axios.get(
                        `${API_URL}/api/lifts/chit/${id}/month/${nextMonth}/status`,
                        config
                    );
                    setMonthStatus(statusRes.data);
                }

                // Check if lifter already selected for current month
                const hasLifter = chitRes.data.lifts?.some(lr => lr.month === nextMonth);
                setLifterSelected(hasLifter);

                setLoading(false);
            } catch (error) {
                console.error(error);
                alert(error.response?.data?.message || 'Error loading data');
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        } else {
            navigate('/login');
        }
    }, [id, user, navigate]);

    const handleSelectLifter = async () => {
        if (!selectedMember) {
            toast.error('Please select a member to lift');
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Lifter Selection',
            message: `Are you sure you want to select this member as the lifter for Month ${currentMonth}? This action cannot be undone.`,
            confirmText: 'Confirm Selection',
            isDanger: false,
            onConfirm: async () => {
                setSubmitting(true);
                try {
                    const token = user.token;
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };

                    await axios.post(
                        `${API_URL}/api/lifts/select`,
                        {
                            chitId: id,
                            month: currentMonth,
                            memberId: selectedMember,
                        },
                        config
                    );

                    toast.success(`Lifter selected successfully for Month ${currentMonth}!`);
                    setLifterSelected(true);
                    setSubmitting(false);
                    // Refresh chit data
                    const chitRes = await axios.get(`${API_URL}/api/chits/${id}`, config);
                    setChit(chitRes.data);
                } catch (error) {
                    console.error(error);
                    toast.error(error.response?.data?.message || 'Error selecting lifter');
                    setSubmitting(false);
                }
            }
        });
    };

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob', // Important for file download
            };

            const response = await axios.get(
                `${API_URL}/api/reports/chit/${id}/month/${currentMonth}/pdf`,
                config
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${chit.name.replace(/\s+/g, '_')}_Month_${currentMonth}_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setDownloadingPDF(false);
            alert('PDF downloaded successfully!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error downloading PDF');
            setDownloadingPDF(false);
        }
    };

    const handleAdvanceMonth = async () => {

        setAdvancing(true);
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.post(
                `${API_URL}/api/chits/${id}/advance-month`,
                {},
                config
            );

            toast.success(`Successfully advanced to Month ${currentMonth + 1}!`);
            navigate(`/chits/${id}`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error advancing month');
            setAdvancing(false);
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;
    if (!chit) return <div className="text-center mt-20">Chit not found</div>;

    // Check if organizer
    if (chit.organizer !== user._id) {
        return (
            <div className="text-center mt-20">
                <p className="text-red-600 font-semibold">Only the organizer can select monthly lifters</p>
                <button
                    onClick={() => navigate(`/chits/${id}`)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                    Back to Chit Details
                </button>
            </div>
        );
    }

    // Check if all months completed
    if (currentMonth > chit.totalMonths) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-green-800 mb-2">Chit Completed!</h2>
                    <p className="text-green-700">All {chit.totalMonths} months have been completed.</p>
                    <button
                        onClick={() => navigate(`/chits/${id}`)}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Back to Chit Details
                    </button>
                </div>
            </div>
        );
    }

    const liftAmount = chit.monthlyContribution * chit.totalMonths; // 420,000
    const remainingMonths = chit.totalMonths - currentMonth;
    const extraDueTotal = remainingMonths * chit.extraChargePerMonth;

    // Get available members (who haven't lifted)
    const availableMembers = chit.members.filter(m =>
        m.status === 'approved' && !m.hasLifted
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Monthly Lift Selection</h1>
                        <p className="text-slate-500 mt-1">{chit.name}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/chits/${id}`)}
                        className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 w-full md:w-auto"
                    >
                        Back
                    </button>
                </div>

                {/* Current Month Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-4">Month {currentMonth} of {chit.totalMonths}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-md">
                            <p className="text-sm text-slate-500 mb-1">Collected So Far</p>
                            <p className="text-2xl font-bold text-blue-600">₹{monthStatus?.currentMonthCollected?.toLocaleString() || 0}</p>
                            <p className="text-xs text-slate-500">Target Pool: ₹{monthStatus?.projectedPool?.toLocaleString() || '...'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-md">
                            <p className="text-sm text-slate-500 mb-1">Commission</p>
                            <p className="text-2xl font-bold text-red-600">₹{monthStatus?.projectedCommission?.toLocaleString() || '...'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-md">
                            <p className="text-sm text-slate-500 mb-1">Lifter Payout</p>
                            <p className="text-2xl font-bold text-green-600">₹{monthStatus?.projectedPayout?.toLocaleString() || '...'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-md">
                            <p className="text-sm text-slate-500 mb-1">Extra Due (Total)</p>
                            <p className="text-2xl font-bold text-orange-600">₹{extraDueTotal.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{remainingMonths} months × ₹{chit.extraChargePerMonth.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Status */}
                {monthStatus && (
                    <div className={`border-l-4 p-6 mb-6 rounded-lg ${monthStatus.readyForLiftSelection
                        ? 'bg-green-50 border-green-400'
                        : 'bg-yellow-50 border-yellow-400'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`text-lg font-semibold mb-1 ${monthStatus.readyForLiftSelection ? 'text-green-800' : 'text-yellow-800'
                                    }`}>
                                    Payment Status: {monthStatus.paidCount}/{monthStatus.totalMembers} Members Paid
                                </h3>
                                <p className={monthStatus.readyForLiftSelection ? 'text-green-700' : 'text-yellow-700'}>
                                    {monthStatus.readyForLiftSelection
                                        ? '✓ All members have paid. You can now select a lifter.'
                                        : `Waiting for ${monthStatus.totalMembers - monthStatus.paidCount} more payment(s)`
                                    }
                                </p>
                            </div>
                            {monthStatus.readyForLiftSelection ? (
                                <CheckCircle className="text-green-600" size={32} />
                            ) : (
                                <AlertCircle className="text-yellow-600" size={32} />
                            )}
                        </div>
                    </div>
                )}

                {/* Member Selection */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Select Member to Lift</h3>

                    {availableMembers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p>No members available to lift. All members have already lifted.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Available Members ({availableMembers.length})
                                </label>
                                <select
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!monthStatus?.readyForLiftSelection}
                                >
                                    <option value="">-- Select a member --</option>
                                    {availableMembers.map((member) => (
                                        <option key={member.user._id} value={member.user._id}>
                                            {member.user.name} ({member.user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedMember && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Lift Summary:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Collected Pool: ₹{monthStatus?.projectedPool?.toLocaleString()}</li>
                                        <li>• Less Commission: -₹{monthStatus?.projectedCommission?.toLocaleString()}</li>
                                        <li className="font-bold">• Member Payout: ₹{monthStatus?.projectedPayout?.toLocaleString()}</li>
                                        <li className="mt-2 text-orange-800">• Future Liability: ₹{chit.extraChargePerMonth.toLocaleString()}/month extra</li>
                                        <li className="text-orange-800">• Total Extra Due: ₹{extraDueTotal.toLocaleString()} ({remainingMonths} months)</li>
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleSelectLifter}
                                disabled={!selectedMember || !monthStatus?.readyForLiftSelection || submitting}
                                className={`w-full py-3 rounded-md font-semibold transition ${selectedMember && monthStatus?.readyForLiftSelection && !submitting
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {submitting ? 'Selecting...' : 'Confirm Lift Selection'}
                            </button>

                            {!monthStatus?.readyForLiftSelection && (
                                <p className="text-sm text-yellow-600 mt-2 text-center">
                                    All members must pay before you can select a lifter
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* PDF Download and Month Advancement Section */}
                {lifterSelected && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 border-2 border-green-200">
                        <div className="flex items-center mb-4">
                            <CheckCircle className="text-green-600 mr-2" size={32} />
                            <div>
                                <h3 className="text-xl font-bold text-green-800">Lifter Selected for Month {currentMonth}!</h3>
                                <p className="text-sm text-green-700">Complete the monthly cycle by downloading the report and advancing to the next month.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-w-md mx-auto">
                            {/* Download PDF Button */}
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloadingPDF}
                                className={`flex items-center justify-center py-3 px-4 rounded-md font-semibold transition w-full ${downloadingPDF
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <FileText className="mr-2" size={20} />
                                {downloadingPDF ? 'Downloading...' : 'Download Monthly Report (PDF)'}
                            </button>

                            {/* Advance Month Button */}
                            <button
                                onClick={handleAdvanceMonth}
                                disabled={advancing}
                                className={`flex items-center justify-center py-3 px-4 rounded-md font-semibold transition w-full ${advancing
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                <ArrowRight className="mr-2" size={20} />
                                {advancing ? 'Advancing...' : `Advance to Month ${currentMonth + 1}`}
                            </button>
                        </div>

                        <div className="mt-4 bg-white rounded-md p-4 border border-blue-200">
                            <h4 className="font-semibold text-slate-800 mb-2">📋 Next Steps:</h4>
                            <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                                <li>Download the monthly report PDF for your records</li>
                                <li>Review all transaction details and payment modes</li>
                                <li>Click "Advance to Month {currentMonth + 1}" to start the next cycle</li>
                                <li>System will automatically reset for new month</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
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

export default LiftSelection;
