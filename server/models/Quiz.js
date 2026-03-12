const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) { return v.length === 4; },
            message: 'Each question must have exactly 4 options'
        }
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    }
});

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Quiz title is required'],
        trim: true,
        maxlength: 120
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function (v) { return v.length >= 1; },
            message: 'Quiz must have at least 1 question'
        }
    },
    quizCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    dashboardPublic: {
        type: Boolean,
        default: false
    },
    timePerQuestion: {
        type: Number,
        default: 30,
        min: 5,
        max: 300
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
