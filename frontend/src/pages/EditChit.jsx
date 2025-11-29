import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getChit, reset } from '../features/chits/chitSlice';
import chitService from '../features/chits/chitService';

function EditChit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { chit, isLoading } = useSelector((state) => state.chits);

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        months: '',
        maxMembers: '',
        startDate: '',
    });

    const { name, amount, months, maxMembers, startDate } = formData;

    useEffect(() => {
        if (user) {
            dispatch(getChit(id));
        } else {
            navigate('/login');
        }

        return () => {
            dispatch(reset());
        };
    }, [id, user, navigate, dispatch]);

    useEffect(() => {
        if (chit) {
            // Check if user is organizer
            if (chit.organizer !== user._id) {
                alert('You are not authorized to edit this chit');
                navigate(`/chits/${id}`);
                return;
            }

            // Populate form with existing data
            setFormData({
                name: chit.name || '',
                amount: chit.amount || '',
                months: chit.months || '',
                maxMembers: chit.maxMembers || '',
                startDate: chit.startDate ? chit.startDate.split('T')[0] : '',
            });
        }
    }, [chit, user, id, navigate]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const chitData = {
                name,
                amount: Number(amount),
                months: Number(months),
                maxMembers: Number(maxMembers),
                startDate,
            };

            await chitService.updateChit(id, chitData, user.token);
            alert('Chit updated successfully!');
            navigate(`/chits/${id}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating chit');
        }
    };

    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Edit Chit Group</h1>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chit Group Name</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            required
                            className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Monthly Savings Group A"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={amount}
                                onChange={onChange}
                                required
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="100000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                            <input
                                type="number"
                                name="months"
                                value={months}
                                onChange={onChange}
                                required
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Members</label>
                            <input
                                type="number"
                                name="maxMembers"
                                value={maxMembers}
                                onChange={onChange}
                                required
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={startDate}
                                onChange={onChange}
                                required
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/chits/${id}`)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Update Chit Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditChit;
