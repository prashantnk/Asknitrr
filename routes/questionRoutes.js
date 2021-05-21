const express = require('express');
const Question = require('../models/question');
const User = require('../models/user');
const Answer = require('../models/answer');
const router = express.Router();
const { mail } = require('../mailer');


router.get("/questions", (req, res) => {
    Question.find({}, (err, found) => {
        found.reverse();
        res.render("questions", { questions: found, login: req.user, topic: "" });
    })
});
router.get("/questions/topics/:topic", (req, res) => {
    Question.find({ topic: req.params.topic.toUpperCase() }, (err, found) => {
        //console.log(req.params.topic);
        found.reverse();
        res.render("questions", { questions: found, login: req.user, topic: req.params.topic });
    })
});
router.get("/submit/:questionId", (req, res) => {
    if (req.isAuthenticated() || req.user) {
        Question.findOne({ _id: req.params.questionId }, (err, ques) => {
            if (ques) {
                res.render("submit", { question: ques, login: req.user });
            }
            else res.send("<h1>404 not found ! </h1>")
        })
    } else res.redirect("/login");
});
router.post("/submit", (req, res) => {
    const newAnswer = new Answer({
        questionId: req.body.questionId,
        answer: req.body.answer,
        userId: req.user._id,
        vote: 0
    });
    // console.log(newAnswer);
    Question.findOne({ _id: newAnswer.questionId }, (err, found) => {
        // console.log(found);
        User.findOne({ _id: found.userId }, (err, user) => {
            if (user) mail(user.username, "SOMEONE Answered Your question !", "New answer on your question")
        })
    });
    newAnswer.save();
    res.redirect("/questions/" + req.body.questionId);
});
router.get("/questions/:questionId", (req, res) => {
    Question.findOne({ _id: req.params.questionId }, (err, ques) => {
        if (ques) {
            Answer.find({ questionId: req.params.questionId }, (err, ans) => {
                ans.reverse();
                res.render("question", { question: ques, answers: ans, login: req.user });
            });
        }
        else res.send("<h1>404 not found ! </h1>")
    })
});
router.get("/newquestion", (req, res) => {
    if (req.isAuthenticated() || req.user) {
        res.render("newquestion", { login: req.user });
    }
    else res.redirect("/login");
});
router.post("/newquestion", (req, res) => {
    const question = new Question({
        topic: req.body.topic,
        heading: req.body.heading,
        discription: req.body.question,
        userId: req.user._id,
        vote: 0
    });
    User.find({ topics: question.topic }, { _id: 0, username: 1 }, (err, found) => {
        found = found.map((user) => {
            return user.username.concat(" ");
        });
        found = found.toString();
        mail(found, "SOMEONE UPLOADED NEW QUESTION !", "New Question On Your interested topic!")
    })
    question.save();
    res.redirect("/questions");
});
router.post("/delete", (req, res) => {
    const id = req.body.id;
    Question.deleteOne({ _id: id }, (err) => { });
    Answer.deleteOne({ _id: id }, (err) => { });
    Answer.deleteMany({ questionId: id }, (err) => { });
    res.redirect(req.headers.referer);
});

module.exports = router;