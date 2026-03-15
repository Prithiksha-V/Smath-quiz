const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: {
        type: [Number],
        default: []
    },
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    rank: {
        type: Number,
        default: 0
    },
    emoji: {
        type: String,
        default: ''
    },
    motivationalMessage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

participantSchema.index({ quizId: 1, score: -1 });

module.exports = mongoose.model('Participant', participantSchema);
