const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Quiz = require('../models/Quiz');

// Helper: Assign emoji and message based on rank
function getEmojiAndMessage(rank, totalParticipants) {
    const percentile = ((totalParticipants - rank) / totalParticipants) * 100;

    if (rank === 1) {
        return { emoji: '🏆', motivationalMessage: "🏆 Champion! You're absolutely on fire! 🔥" };
    } else if (rank === 2) {
        return { emoji: '🥈', motivationalMessage: "🥈 Amazing! So close to the top! Keep pushing! ⭐" };
    } else if (rank === 3) {
        return { emoji: '🥉', motivationalMessage: "🥉 Great job! You're a star! ✨" };
    } else if (percentile >= 75) {
        return { emoji: '🔥', motivationalMessage: "🔥 You're blazing through! Almost at the top! 💪" };
    } else if (percentile >= 50) {
        return { emoji: '💪', motivationalMessage: "💪 Solid performance! Keep it up, you've got this! 🌟" };
    } else if (percentile >= 25) {
        return { emoji: '😊', motivationalMessage: "😊 Good effort! A little more practice and you'll shine! 📚" };
    } else {
        return { emoji: '💫', motivationalMessage: "💫 Don't worry! Every expert was once a beginner! Come back stronger! 🚀" };
    }
}

// Join quiz
router.post('/join', async (req, res) => {
    try {
        const { name, quizCode } = req.body;

        if (!name || !quizCode) {
            return res.status(400).json({ message: 'Name and quiz code are required' });
        }

        const quiz = await Quiz.findOne({ quizCode });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (!quiz.isActive) return res.status(400).json({ message: 'This quiz is no longer active' });

        // Check if participant already joined
        const existing = await Participant.findOne({ name: name.trim(), quizId: quiz._id });
        if (existing) {
            if (existing.completed) {
                return res.status(400).json({ message: 'You have already completed this quiz' });
            }
            return res.json({
                message: 'Welcome back!',
                participant: existing,
                quizId: quiz._id
            });
        }

        const participant = new Participant({
            name: name.trim(),
            quizId: quiz._id,
            totalQuestions: quiz.questions.length
        });

        await participant.save();

        res.status(201).json({
            message: 'Joined successfully!',
            participant,
            quizId: quiz._id
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Submit answers
router.post('/submit', async (req, res) => {
    try {
        const { participantId, answers, timeTaken } = req.body;

        if (!participantId || !answers) {
            return res.status(400).json({ message: 'Participant ID and answers are required' });
        }

        const participant = await Participant.findById(participantId);
        if (!participant) return res.status(404).json({ message: 'Participant not found' });
        if (participant.completed) return res.status(400).json({ message: 'Quiz already submitted' });

        const quiz = await Quiz.findById(participant.quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Calculate score
        let score = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                score++;
            }
        });

        participant.answers = answers;
        participant.score = score;
        participant.totalQuestions = quiz.questions.length;
        participant.timeTaken = timeTaken || 0;
        participant.completed = true;
        await participant.save();

        // Recalculate ranks for all completed participants
        const allParticipants = await Participant.find({
            quizId: quiz._id,
            completed: true
        }).sort({ score: -1, timeTaken: 1 });

        const totalParticipants = allParticipants.length;

        for (let i = 0; i < allParticipants.length; i++) {
            const rank = i + 1;
            const { emoji, motivationalMessage } = getEmojiAndMessage(rank, totalParticipants);
            allParticipants[i].rank = rank;
            allParticipants[i].emoji = emoji;
            allParticipants[i].motivationalMessage = motivationalMessage;
            await allParticipants[i].save();
        }

        // Get updated participant
        const updatedParticipant = await Participant.findById(participantId);

        res.json({
            message: 'Quiz submitted successfully!',
            participant: updatedParticipant,
            totalQuestions: quiz.questions.length,
            correctAnswers: quiz.questions.map(q => q.correctAnswer)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get leaderboard
router.get('/leaderboard/:quizId', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Check if dashboard is public or if admin is requesting
        const authHeader = req.header('Authorization');
        const isAdmin = !!authHeader;

        if (!quiz.dashboardPublic && !isAdmin) {
            return res.status(403).json({ message: 'Leaderboard is private. Only the admin can view it.' });
        }

        const participants = await Participant.find({
            quizId: req.params.quizId,
            completed: true
        }).sort({ score: -1, timeTaken: 1 });

        const totalParticipants = await Participant.countDocuments({ quizId: req.params.quizId });
        const completedCount = participants.length;

        const leaderboard = participants.map((p, index) => ({
            _id: p._id,
            name: p.name,
            score: p.score,
            totalQuestions: p.totalQuestions,
            timeTaken: p.timeTaken,
            rank: index + 1,
            emoji: p.emoji,
            motivationalMessage: p.motivationalMessage,
            percentage: Math.round((p.score / p.totalQuestions) * 100)
        }));

        res.json({
            quizTitle: quiz.title,
            totalParticipants,
            completedCount,
            dashboardPublic: quiz.dashboardPublic,
            leaderboard
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
