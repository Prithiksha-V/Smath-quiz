import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { HiOutlineUser, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi';

export default function JoinQuiz() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [quizInfo, setQuizInfo] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const data = await apiFetch(`/quiz/code/${code}`);
                setQuizInfo(data);
            } catch (err) {
                setError(err.message || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [code]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError('Please enter your name');
        if (!email.trim()) return setError('Please enter your email address');

        setJoining(true);
        setError('');

        try {
            const data = await apiFetch('/participant/join', {
                method: 'POST',
                body: JSON.stringify({ name, email, quizCode: code })
            });

            // Store participant info
            localStorage.setItem('participant_temp', JSON.stringify({
                id: data.participant._id,
                name: data.participant.name,
                quizId: data.quizId,
                code
            }));

            // Navigate to take quiz
            navigate(`/quiz/take/${code}`);
        } catch (err) {
            if (err.message.includes('completed')) {
                navigate(`/quiz/results`); // If already completed, just send them to results (simplified logic)
            } else {
                setError(err.message || 'Failed to join quiz');
            }
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="auth-page animate-fade-in">
            <div className="glass-card auth-card">
                {error ? (
                    <>
                        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>{error}</div>
                        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ width: '100%' }}>
                            Go Home
                        </button>
                    </>
                ) : quizInfo ? (
                    <>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{quizInfo.title}</h1>
                        <p className="subtitle">{quizInfo.description}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <HiOutlineDocumentText size={24} color="var(--accent-purple)" />
                                <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>{quizInfo.questionCount}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Questions</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <HiOutlineClock size={24} color="var(--accent-cyan)" />
                                <p style={{ fontWeight: '600', marginTop: '0.5rem' }}>{quizInfo.timePerQuestion}s</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Per Question</p>
                            </div>
                        </div>

                        <form onSubmit={handleJoin}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Your Name</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <HiOutlineUser size={20} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.1rem' }}
                                        placeholder="Enter your name..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <HiOutlineUser size={20} />
                                    </span>
                                    <input
                                        type="email"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.1rem' }}
                                        placeholder="Enter your email to start..."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success btn-lg"
                                style={{ width: '100%' }}
                                disabled={joining}
                            >
                                {joining ? 'Joining...' : 'Start Quiz Now 🚀'}
                            </button>
                        </form>
                    </>
                ) : null}
            </div>
        </div>
    );
}
