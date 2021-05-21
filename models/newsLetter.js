const mongoose = require('mongoose');

const NewsletterUserSchema = new mongoose.Schema({
    email: String
}, { timestamps: true });
const NewsletterUser = new mongoose.model("NewsletterUser", NewsletterUserSchema);

module.exports = NewsletterUser;

