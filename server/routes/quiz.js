const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Quiz = require('../models/Quiz');
const Participant = require('../models/Participant');
const auth = require('../middleware/auth');

// Create Quiz
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, questions, timePerQuestion, category } = req.body;

        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ message: 'Title and at least one question are required' });
        }

        const quizCode = nanoid(8);

        const quiz = new Quiz({
            title,
            description: description || '',
            questions,
            quizCode,
            adminId: req.admin.id,
            timePerQuestion: timePerQuestion || 30,
            category: category || 'General'
        });

        await quiz.save();

        res.status(201).json({
            message: 'Quiz created successfully',
            quiz,
            shareLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/quiz/join/${quizCode}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all quizzes for logged-in admin
router.get('/admin/all', auth, async (req, res) => {
    try {
        const quizzes = await Quiz.find({ adminId: req.admin.id }).sort({ createdAt: -1 });

        const quizzesWithStats = await Promise.all(
            quizzes.map(async (quiz) => {
                const participantCount = await Participant.countDocuments({ quizId: quiz._id });
                const completedCount = await Participant.countDocuments({ quizId: quiz._id, completed: true });
                return {
                    ...quiz.toObject(),
                    participantCount,
                    completedCount
                };
            })
        );

        res.json(quizzesWithStats);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get quiz by ID (admin)
router.get('/detail/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, adminId: req.admin.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const participants = await Participant.find({ quizId: quiz._id }).sort({ score: -1, timeTaken: 1 });
        const completedCount = participants.filter(p => p.completed).length;

        res.json({ quiz, participants, completedCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get quiz by share code (for participants)
router.get('/code/:code', async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ quizCode: req.params.code });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (!quiz.isActive) return res.status(400).json({ message: 'This quiz is no longer active' });

        // Don't send correct answers to participants
        const safeQuiz = {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                options: q.options
            })),
            quizCode: quiz.quizCode,
            timePerQuestion: quiz.timePerQuestion,
            category: quiz.category,
            questionCount: quiz.questions.length
        };

        res.json(safeQuiz);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update quiz (toggle active, dashboard visibility)
router.put('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, adminId: req.admin.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const { isActive, dashboardPublic, title, description } = req.body;
        if (typeof isActive === 'boolean') quiz.isActive = isActive;
        if (typeof dashboardPublic === 'boolean') quiz.dashboardPublic = dashboardPublic;
        if (title) quiz.title = title;
        if (description !== undefined) quiz.description = description;

        await quiz.save();
        res.json({ message: 'Quiz updated', quiz });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, adminId: req.admin.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        await Participant.deleteMany({ quizId: quiz._id });
        res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
