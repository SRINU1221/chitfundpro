import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

function Header() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { chits } = useSelector((state) => state.chits);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Check if user is an organizer (has chits where they are the organizer)
    const isOrganizer = chits && chits.length > 0 && chits.some(chit => chit.organizer === user?._id);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Link to="/" className="text-2xl font-bold tracking-tight text-blue-400">
                        ChitFund<span className="text-white">Pro</span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center space-x-6">
                    {user ? (
                        <>
                            <Link to="/dashboard" className="hover:text-blue-300 transition">Dashboard</Link>
                            {!isOrganizer && (
                                <Link to="/payments" className="hover:text-blue-300 transition">Payments</Link>
                            )}
                            <button
                                onClick={onLogout}
                                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-blue-300 transition">Login</Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </nav>

                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800 px-4 py-4 space-y-4 absolute top-16 left-0 right-0 shadow-xl border-t border-slate-700 z-50">
                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="block hover:text-blue-300 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            {!isOrganizer && (
                                <Link
                                    to="/payments"
                                    className="block hover:text-blue-300 py-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Payments
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onLogout();
                                }}
                                className="flex items-center space-x-1 text-red-400 hover:text-red-300 py-2 w-full"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="block hover:text-blue-300 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="block hover:text-blue-300 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}

export default Header;
