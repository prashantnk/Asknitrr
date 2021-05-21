const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    takenId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Voter = new mongoose.model("Voter", voterSchema);

module.exports = Voter;