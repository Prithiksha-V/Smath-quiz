import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { HiOutlineDocumentText, HiOutlineUsers, HiOutlineClock, HiOutlineLink, HiOutlineTrash, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function Dashboard() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchQuizzes = async () => {
        try {
            const data = await apiFetch('/quiz/admin/all');
            setQuizzes(data);
        } catch (err) {
            setError(err.message || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const copyLink = (code) => {
        const url = `${window.location.origin}/quiz/join/${code}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await apiFetch(`/quiz/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !currentStatus })
            });
            fetchQuizzes();
        } catch (err) {
            alert('Failed to update quiz status');
        }
    };

    const deleteQuiz = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quiz? All participant data will be lost.')) return;

        try {
            await apiFetch(`/quiz/${id}`, { method: 'DELETE' });
            fetchQuizzes();
        } catch (err) {
            alert('Failed to delete quiz');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your quizzes...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>Manage your quizzes and view results</p>
                </div>
                <Link to="/create-quiz" className="btn btn-primary">
                    Create New Quiz
                </Link>
            </div>

            {error ? (
                <div className="alert alert-error">{error}</div>
            ) : quizzes.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <HiOutlineDocumentText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <h3>No Quizzes Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Create your first AI-powered quiz now!</p>
                    <Link to="/create-quiz" className="btn btn-primary">Create Quiz</Link>
                </div>
            ) : (
                <div className="quiz-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.5rem',
                    marginTop: '2rem'
                }}>
                    {quizzes.map(quiz => (
                        <div key={quiz._id} className="glass-card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: quiz.isActive ? 1 : 0.7
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', paddingRight: '1rem' }}>{quiz.title}</h3>
                                <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                    {quiz.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                                {quiz.description || 'No description provided.'}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <HiOutlineDocumentText size={16} />
                                    <span>{quiz.questions.length} Questions</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <HiOutlineClock size={16} />
                                    <span>{quiz.timePerQuestion}s / q</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <HiOutlineUsers size={16} />
                                    <span>{quiz.participantCount} Joined</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
                                    <HiOutlineUsers size={16} />
                                    <span>{quiz.completedCount} Completed</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => copyLink(quiz.quizCode)}
                                    className="btn btn-secondary btn-sm"
                                    title="Copy Share Link"
                                >
                                    <HiOutlineLink size={16} /> Share
                                </button>
                                <Link
                                    to={`/quiz/detail/${quiz._id}`}
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1 }}
                                >
                                    View Details
                                </Link>
                                <button
                                    onClick={() => toggleActive(quiz._id, quiz.isActive)}
                                    className="btn btn-secondary btn-sm"
                                    title={quiz.isActive ? "Deactivate" : "Activate"}
                                >
                                    {quiz.isActive ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                                </button>
                                <button
                                    onClick={() => deleteQuiz(quiz._id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: 'var(--accent-red)' }}
                                    title="Delete"
                                >
                                    <HiOutlineTrash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
