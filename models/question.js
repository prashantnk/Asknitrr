const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    topic: String,
    heading: String,
    discription: String,
    userId: mongoose.Schema.Types.ObjectId,
    vote: Number
}, { timestamps: true });

questionSchema.index({ '$**': 'text' });

const Question = new mongoose.model("Question", questionSchema);

module.exports = Question;