import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createChit, reset } from '../features/chits/chitSlice';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

function CreateChit() {
    const [formData, setFormData] = useState({
        name: '',
        totalMembers: 21,
        monthlyContribution: 20000,
        totalMonths: 21,
        extraChargePerMonth: 4000,
        commission: 8000,
        startDate: '',
    });

    const { name, totalMembers, monthlyContribution, totalMonths, extraChargePerMonth, commission, startDate } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.chits
    );

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            alert(message);
        }

        if (isSuccess) {
            navigate('/dashboard');
        }
    }, [isError, isSuccess, message, navigate]);

    const onChange = (e) => {
        const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        const chitData = {
            name,
            totalMembers: Number(totalMembers),
            monthlyContribution: Number(monthlyContribution),
            totalMonths: Number(totalMonths),
            extraChargePerMonth: Number(extraChargePerMonth),
            commission: Number(commission),
            startDate,
        };

        dispatch(createChit(chitData));
    };

    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    // Calculate derived values
    const totalLiftAmount = monthlyContribution * totalMembers;
    const maxExtraPerMember = extraChargePerMonth * (totalMonths - 1);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Create New Chit Group</h1>
                <p className="text-slate-500 mb-6">Customize your chit fund structure</p>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Chit Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chit Group Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            required
                            className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Monthly Savings Group - January 2025"
                        />
                    </div>

                    {/* Chit Structure - Editable */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-4">Chit Structure</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <Users className="inline mr-1" size={16} />
                                    Total Members *
                                </label>
                                <input
                                    type="number"
                                    name="totalMembers"
                                    value={totalMembers}
                                    onChange={onChange}
                                    required
                                    min="2"
                                    max="100"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <DollarSign className="inline mr-1" size={16} />
                                    Monthly Contribution (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="monthlyContribution"
                                    value={monthlyContribution}
                                    onChange={onChange}
                                    required
                                    min="1000"
                                    step="100"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <Calendar className="inline mr-1" size={16} />
                                    Duration (Months) *
                                </label>
                                <input
                                    type="number"
                                    name="totalMonths"
                                    value={totalMonths}
                                    onChange={onChange}
                                    required
                                    min="3"
                                    max="60"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <TrendingUp className="inline mr-1" size={16} />
                                    Extra Charge After Lift (₹/month) *
                                </label>
                                <input
                                    type="number"
                                    name="extraChargePerMonth"
                                    value={extraChargePerMonth}
                                    onChange={onChange}
                                    required
                                    min="0"
                                    step="100"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <DollarSign className="inline mr-1" size={16} />
                                    Organizer Commission (₹/month) *
                                </label>
                                <input
                                    type="number"
                                    name="commission"
                                    value={commission}
                                    onChange={onChange}
                                    required
                                    min="0"
                                    step="100"
                                    className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calculated Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="font-semibold text-green-900 mb-3">Calculated Values:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-green-700">Total Collection (per month):</span>
                                <span className="font-bold text-green-900">₹{(monthlyContribution * totalMembers).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Organizer Commission:</span>
                                <span className="font-bold text-green-900">₹{commission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Base Lift Amount (Month 1):</span>
                                <span className="font-bold text-green-900">₹{(monthlyContribution * totalMembers - commission).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Payment After Lift:</span>
                                <span className="font-bold text-green-900">₹{(monthlyContribution + extraChargePerMonth).toLocaleString()}/month</span>
                            </div>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2">How It Works:</h3>
                        <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• All {totalMembers} members pay ₹{monthlyContribution.toLocaleString()} every month</li>
                            <li>• Organizer selects one member to lift each month</li>
                            <li>• Lifted member receives ₹{totalLiftAmount.toLocaleString()}</li>
                            <li>• After lifting, member pays ₹{(monthlyContribution + extraChargePerMonth).toLocaleString()}/month (₹{monthlyContribution.toLocaleString()} + ₹{extraChargePerMonth.toLocaleString()} extra)</li>
                            <li>• Each member can lift only once</li>
                            <li>• Cycle continues for {totalMonths} months</li>
                        </ul>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                        <input
                            type="date"
                            name="startDate"
                            value={startDate}
                            onChange={onChange}
                            required
                            className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold"
                        >
                            Create Chit Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateChit;
