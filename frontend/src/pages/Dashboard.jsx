import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OrganizerDashboard from './OrganizerDashboard';
import ParticipantDashboard from './ParticipantDashboard';

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <>
            {user.role === 'admin' ? <OrganizerDashboard /> : <ParticipantDashboard />}
        </>
    );
}

export default Dashboard;
