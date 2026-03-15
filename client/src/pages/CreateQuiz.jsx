import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { HiOutlineSparkles, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Basic Settings
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timePerQuestion, setTimePerQuestion] = useState(30);
    const [category, setCategory] = useState('General');

    // AI Settings
    const [topic, setTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [difficulty, setDifficulty] = useState('medium');

    // Questions
    const [questions, setQuestions] = useState([
        { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);

    const handleGenerateAI = async () => {
        if (!topic.trim()) return setError('Please enter a topic for AI generation');

        setLoading(true);
        setError('');

        try {
            const data = await apiFetch('/ai/generate-questions', {
                method: 'POST',
                body: JSON.stringify({ topic, numberOfQuestions: Number(aiCount), difficulty })
            });

            setQuestions(data.questions);
            setMode('manual'); // Switch back to manual to review/edit

            if (!title) setTitle(`${topic} Quiz`);
            if (!category) setCategory(topic);

        } catch (err) {
            setError(err.message || 'AI generation failed');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return alert('At least one question is required');
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs);
    };

    const updateQuestion = (index, field, value) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setQuestions(newQs);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQs = [...questions];
        const newOptions = [...newQs[qIndex].options];
        newOptions[oIndex] = value;
        newQs[qIndex] = { ...newQs[qIndex], options: newOptions };
        setQuestions(newQs);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (questions.length === 0) return setError('Please add at least one question');

        // Validate
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) return setError(`Question ${i + 1} text is missing`);
            for (let j = 0; j < 4; j++) {
                if (!q.options[j].trim()) return setError(`Question ${i + 1}, Option ${j + 1} is missing`);
            }
        }

        setLoading(true);
        setError('');

        try {
            const data = await apiFetch('/quiz', {
                method: 'POST',
                body: JSON.stringify({
                    title, description, timePerQuestion: Number(timePerQuestion), category, questions
                })
            });

            alert('Quiz created successfully!');
            navigate(`/dashboard`);
        } catch (err) {
            setError(err.message || 'Failed to finish saving quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <h1>Create New Quiz</h1>
                <p>Build from scratch or let AI do the heavy lifting ✨</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMode('manual')}
                    style={{ flex: 1 }}
                >
                    📝 Manual Mode
                </button>
                <button
                    className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMode('ai')}
                    style={{ flex: 1, backgroundImage: mode === 'ai' ? 'var(--gradient-primary)' : 'none' }}
                >
                    <HiOutlineSparkles /> AI Generator
                </button>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Basic Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Quiz Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. JavaScript Basics"
                            value={title} onChange={e => setTitle(e.target.value)} required
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Description</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Briefly describe what this quiz is about..."
                            value={description} onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Programming"
                            value={category} onChange={e => setCategory(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Time per Question (seconds)</label>
                        <input
                            type="number"
                            className="form-input"
                            min="5" max="300"
                            value={timePerQuestion} onChange={e => setTimePerQuestion(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {mode === 'ai' && (
                <div className="glass-card animate-slide-up" style={{ marginBottom: '2rem', border: '1px solid var(--accent-purple)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-violet)' }}>
                        <HiOutlineSparkles /> Generate with Gemini AI
                    </h3>

                    <div className="form-group">
                        <label>Topic *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. World War II History, React Hooks, Solar System..."
                            value={topic} onChange={e => setTopic(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label>Number of Questions</label>
                            <input
                                type="number" className="form-input"
                                min="1" max="20"
                                value={aiCount} onChange={e => setAiCount(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Difficulty</label>
                            <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleGenerateAI}
                        disabled={loading || !topic}
                    >
                        {loading ? 'Thinking...' : 'Generate Questions'}
                    </button>
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-slide-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem' }}>
                        <h3>Questions ({questions.length})</h3>
                        <button type="button" onClick={addQuestion} className="btn btn-secondary btn-sm">
                            <HiOutlinePlus /> Add Blank Question
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="glass-card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    style={{
                                        position: 'absolute', top: '1rem', right: '1rem',
                                        background: 'transparent', border: 'none', color: 'var(--accent-red)',
                                        cursor: 'pointer', padding: '0.25rem'
                                    }}
                                    title="Remove Question"
                                >
                                    <HiOutlineTrash size={20} />
                                </button>

                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Question {qIndex + 1}</h4>

                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter question here..."
                                        value={q.questionText}
                                        onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={q.correctAnswer === oIndex}
                                                onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-purple)' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={`Option ${oIndex + 1}`}
                                                style={{ flex: 1, borderColor: q.correctAnswer === oIndex ? 'var(--accent-purple)' : 'var(--border-glass)' }}
                                                value={opt}
                                                onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="btn btn-success btn-lg"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save & Publish Quiz'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
