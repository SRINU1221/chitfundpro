import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign } from 'lucide-react';

function ChitCard({ chit, children }) {
    // Calculate total value for lift-based system
    const totalValue = chit.monthlyContribution * chit.totalMembers;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{chit.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${chit.status === 'open' ? 'bg-green-100 text-green-800' :
                        chit.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {chit.status.toUpperCase()}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">₹{totalValue.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Lift Amount</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-slate-600">
                    <Calendar size={18} className="mr-2" />
                    <span>{chit.totalMonths} Months</span>
                </div>
                <div className="flex items-center text-slate-600">
                    <Users size={18} className="mr-2" />
                    <span>{chit.members.length} / {chit.totalMembers} Members</span>
                </div>
                <div className="flex items-center text-slate-600">
                    <DollarSign size={18} className="mr-2" />
                    <span>₹{chit.monthlyContribution.toLocaleString()} / month</span>
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <Link
                    to={`/chits/${chit._id}`}
                    className="flex-1 text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium shadow-sm hover:shadow-md"
                >
                    View Details
                </Link>
                {children}
            </div>
        </div>
    );
}

export default ChitCard;
