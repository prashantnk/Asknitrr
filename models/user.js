const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    topics: [String],
    username: String,
    password: String,
    fname: String,
    lname: String,
    contribution: Number
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose); // it will register user do salting and hashing
const User = new mongoose.model("User", userSchema);

module.exports = User;