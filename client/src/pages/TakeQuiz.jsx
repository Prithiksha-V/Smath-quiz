import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { HiOutlineClock } from 'react-icons/hi';

export default function TakeQuiz() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [quizInfo, setQuizInfo] = useState(null);
    const [participant, setParticipant] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        // Load local participant data
        const pData = localStorage.getItem('participant_temp');
        if (!pData) {
            navigate(`/quiz/join/${code}`);
            return;
        }
        const parsed = JSON.parse(pData);
        if (parsed.code !== code) {
            navigate(`/quiz/join/${code}`);
            return;
        }
        setParticipant(parsed);

        // Fetch Quiz
        const fetchQuiz = async () => {
            try {
                const data = await apiFetch(`/quiz/code/${code}`);
                setQuizInfo(data);
                setAnswers(new Array(data.questionCount).fill(null));
                setTimeLeft(data.timePerQuestion);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load quiz');
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [code, navigate]);

    // Timer logic
    useEffect(() => {
        if (!quizInfo || submitting) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleNextOrSubmit();
                    return 0; // reset via state update in handleNext
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [quizInfo, currentIndex, submitting]); // re-run when index changes

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const selectOption = (optIndex) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optIndex;
        setAnswers(newAnswers);
    };

    const handleNextOrSubmit = async () => {
        clearInterval(timerRef.current); // Stop timer briefly

        if (currentIndex < quizInfo.questionCount - 1) {
            // Next Question
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(quizInfo.timePerQuestion); // Reset timer for next question
        } else {
            // Submit Quiz
            await submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        const totalTimeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        try {
            const result = await apiFetch('/participant/submit', {
                method: 'POST',
                body: JSON.stringify({
                    participantId: participant.id,
                    answers: answers,
                    timeTaken: totalTimeTaken
                })
            });

            // Save result in localStorage for Results page
            localStorage.setItem('quiz_result', JSON.stringify({
                quizId: participant.quizId,
                participant: result.participant,
                totalQuestions: result.totalQuestions
            }));

            navigate(`/quiz/results`); // Note: you'll need a generic results page or pass the quizId
        } catch (err) {
            setError(err.message || 'Submission failed');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (error) return <div className="auth-page"><div className="alert alert-error">{error}</div></div>;
    if (!quizInfo) return null;

    const currentQ = quizInfo.questions[currentIndex];
    const progress = ((currentIndex) / quizInfo.questionCount) * 100;

    // Timer color
    const timerColor = timeLeft <= 10 ? 'var(--accent-red)' :
        timeLeft <= 20 ? 'var(--accent-orange)' : 'var(--accent-cyan)';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{quizInfo.title}</h2>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)', border: `1px solid ${timerColor}`,
                    color: timerColor, fontWeight: '700', fontSize: '1.2rem',
                    transition: 'all var(--transition-normal)'
                }}>
                    <HiOutlineClock />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', marginBottom: '3rem', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${progress}%`, background: 'var(--gradient-primary)',
                    transition: 'width 0.3s ease'
                }}></div>
            </div>

            {/* Question Card */}
            <div className="glass-card animate-slide-up" style={{ padding: '3rem 2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--bg-secondary)', color: 'var(--accent-purple)',
                        fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0
                    }}>
                        {currentIndex + 1}
                    </span>
                    <h1 style={{ fontSize: '1.6rem', lineHeight: '1.4', margin: 0 }}>
                        {currentQ.questionText}
                    </h1>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {currentQ.options.map((opt, idx) => {
                        const isSelected = answers[currentIndex] === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => selectOption(idx)}
                                style={{
                                    textAlign: 'left', padding: '1.2rem 1.5rem',
                                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
                                    border: `2px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                                    fontSize: '1.1rem', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: isSelected ? 'scale(1.02)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        border: `2px solid ${isSelected ? 'var(--accent-purple)' : 'var(--text-muted)'}`,
                                        color: isSelected ? 'var(--accent-purple)' : 'var(--text-muted)',
                                        fontSize: '0.9rem', fontWeight: 'bold'
                                    }}>
                                        {['A', 'B', 'C', 'D'][idx]}
                                    </span>
                                    <span>{opt}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleNextOrSubmit}
                    disabled={submitting || answers[currentIndex] === null}
                >
                    {submitting ? 'Submitting...' : currentIndex < quizInfo.questionCount - 1 ? 'Next Question →' : 'Submit Quiz ✨'}
                </button>
            </div>
        </div>
    );
}
