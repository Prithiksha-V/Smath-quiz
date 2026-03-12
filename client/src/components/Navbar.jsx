import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiOutlineViewGrid, HiOutlinePlusCircle } from 'react-icons/hi';

export default function Navbar() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 2rem',
            background: 'rgba(10, 10, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-glass)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}>
            <Link to={admin ? '/dashboard' : '/login'} style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
            }}>
                🧠 SmartQuiz
            </Link>

            {admin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/dashboard" className="btn btn-secondary btn-sm">
                        <HiOutlineViewGrid /> Dashboard
                    </Link>
                    <Link to="/create-quiz" className="btn btn-primary btn-sm">
                        <HiOutlinePlusCircle /> Create
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 0.5rem' }}>
                        Hi, {admin.name}
                    </span>
                    <button onClick={handleLogout} className="btn btn-sm" style={{
                        background: 'transparent',
                        color: 'var(--accent-red)',
                        border: '1px solid rgba(248,113,113,0.3)',
                    }}>
                        <HiOutlineLogout />
                    </button>
                </div>
            )}
        </nav>
    );
}
