import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { HiOutlineSparkles, HiOutlineArrowLeft } from 'react-icons/hi';

export default function QuizDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchDetail = async () => {
        try {
            const res = await apiFetch(`/quiz/detail/${id}`);
            setData(res);
        } catch (err) {
            setError(err.message || 'Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const result = await apiFetch('/ai/analyze-results', {
                method: 'POST',
                body: JSON.stringify({
                    quizTitle: data.quiz.title,
                    participants: data.participants,
                    totalQuestions: data.quiz.questions.length
                })
            });
            setAiAnalysis(result);
        } catch (err) {
            alert('Failed to analyze: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleSetting = async (field, value) => {
        try {
            await apiFetch(`/quiz/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ [field]: value })
            });
            fetchDetail(); // Reload
        } catch (err) {
            alert('Failed to update setting');
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading details...</p></div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!data) return null;

    const { quiz, participants } = data;
    const completed = participants.filter(p => p.completed);

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                <HiOutlineArrowLeft /> Back to Dashboard
            </Link>

            <div className="page-header">
                <h1>{quiz.title}</h1>
                <p>Quiz Code: <strong style={{ color: 'var(--accent-cyan)' }}>{quiz.quizCode}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card">
                    <h3>Settings</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={quiz.isActive}
                                onChange={() => toggleSetting('isActive', !quiz.isActive)}
                                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-purple)' }}
                            />
                            Accepting Responses (Active)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={quiz.dashboardPublic}
                                onChange={() => toggleSetting('dashboardPublic', !quiz.dashboardPublic)}
                                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-purple)' }}
                            />
                            Public Leaderboard Viewable by Participants
                        </label>
                    </div>
                </div>

                <div className="glass-card">
                    <h3>Stats Overview</h3>
                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Joined</p>
                            <h2 style={{ fontSize: '2rem' }}>{participants.length}</h2>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Completed</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--accent-green)' }}>{completed.length}</h2>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Questions</p>
                            <h2 style={{ fontSize: '2rem' }}>{quiz.questions.length}</h2>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Time Limit (s)</p>
                            <h2 style={{ fontSize: '2rem' }}>{quiz.timePerQuestion}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>AI Result Analysis</h3>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAnalyze}
                        disabled={analyzing || completed.length === 0}
                    >
                        {analyzing ? 'Analyzing...' : <><HiOutlineSparkles /> Generate Insights</>}
                    </button>
                </div>

                {completed.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Waiting for participants to complete the quiz...</p>
                ) : aiAnalysis ? (
                    <div className="animate-slide-up" style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{aiAnalysis.analysis}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Avg: {aiAnalysis.stats.avgScore}</span>
                            <span>High: {aiAnalysis.stats.highestScore}</span>
                            <span>Low: {aiAnalysis.stats.lowestScore}</span>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Click generate to get AI insights about performance.</p>
                )}
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Participant Leaderboard</h3>
                {completed.length === 0 ? (
                    <p className="text-secondary">No complete responses yet.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>Score</th>
                                    <th>Time Taken</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completed.map((p, index) => (
                                    <tr key={p._id}>
                                        <td>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                                #{index + 1} {p.emoji}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                                        <td>{p.score} / {p.totalQuestions} ({Math.round(p.score / p.totalQuestions * 100)}%)</td>
                                        <td>{p.timeTaken}s</td>
                                        <td><span className="badge badge-success">Completed</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
