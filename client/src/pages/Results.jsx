import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';

export default function Results() {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [loadingLB, setLoadingLB] = useState(true);

    useEffect(() => {
        const res = localStorage.getItem('quiz_result');
        if (!res) {
            navigate('/');
            return;
        }
        const parsed = JSON.parse(res);
        setResult(parsed);

        // Fetch leaderboard
        const fetchLB = async () => {
            try {
                const data = await apiFetch(`/participant/leaderboard/${parsed.quizId}`);
                setLeaderboard(data);
            } catch (err) {
                // Might be private, ignore
            } finally {
                setLoadingLB(false);
            }
        };
        fetchLB();
    }, [navigate]);

    if (!result) return null;
    const { participant, totalQuestions } = result;
    const percentage = Math.round((participant.score / totalQuestions) * 100);

    // Gradient based on score
    let scoreColor = 'var(--accent-green)'; // default
    if (percentage < 40) scoreColor = 'var(--accent-red)';
    else if (percentage < 70) scoreColor = 'var(--accent-orange)';

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>

            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2rem' }}>
                <div className="animate-bounce-in" style={{ fontSize: '5rem', marginBottom: '1rem', lineHeight: 1 }}>
                    {participant.emoji || (percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '📚')}
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Quiz Complete, {participant.name}!
                </h1>

                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {participant.motivationalMessage || `You scored ${percentage}%`}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</p>
                        <p style={{ fontSize: '3rem', fontWeight: '800', color: scoreColor }}>
                            {participant.score}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/{totalQuestions}</span>
                        </p>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</p>
                        <p style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                            {participant.rank ? `#${participant.rank}` : '-'}
                        </p>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</p>
                        <p style={{ fontSize: '3rem', fontWeight: '800' }}>
                            {participant.timeTaken}s
                        </p>
                    </div>
                </div>
            </div>

            {leaderboard && leaderboard.dashboardPublic && (
                <div className="glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Live Leaderboard</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Name</th>
                                    <th>Score</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.leaderboard.map((lbP, idx) => (
                                    <tr key={lbP._id} style={{
                                        background: lbP._id === participant._id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                        borderLeft: lbP._id === participant._id ? '3px solid var(--accent-purple)' : 'none'
                                    }}>
                                        <td>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                                #{idx + 1} {lbP.emoji}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: lbP._id === participant._id ? '700' : '500', color: lbP._id === participant._id ? 'var(--accent-violet)' : 'inherit' }}>
                                            {lbP.name} {lbP._id === participant._id && '(You)'}
                                        </td>
                                        <td>{lbP.score} / {lbP.totalQuestions}</td>
                                        <td>{lbP.timeTaken}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {loadingLB === false && !leaderboard && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                    Leaderboard is private for this quiz.
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button className="btn btn-secondary" onClick={() => {
                    localStorage.removeItem('quiz_result');
                    localStorage.removeItem('participant_temp');
                    navigate('/');
                }}>
                    Back to Home
                </button>
            </div>

        </div>
    );
}
