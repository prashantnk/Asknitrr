const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String,
    userId: mongoose.Schema.Types.ObjectId,
    vote: Number
}, { timestamps: true });

const Answer = new mongoose.model("Answer", answerSchema);

module.exports = Answer;