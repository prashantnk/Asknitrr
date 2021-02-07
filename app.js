require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
app.set('trust proxy', 1); // trust first proxy
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://"+process.env.PASS+"@cluster0.kjv0j.mongodb.net/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
const answerSchema = new mongoose.Schema({
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String
});
const questionSchema = new mongoose.Schema({
    topic: String,
    heading: String,
    discription: String
});
const userSchema = new mongoose.Schema({
    topics: [String],
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);
const Question = new mongoose.model("Question", questionSchema);
const Answer = new mongoose.model("Answer", answerSchema);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
app.get("/", (req, res) => {
    // console.log(req.user);
    res.render("home" , {login : req.user});
});
app.get("/questions", (req, res) => {
    Question.find({}, (err, found) => {
        res.render("questions", { questions: found , login : req.user});
    })
});
app.get("/submit/:questionId", (req, res) => {
    if (req.isAuthenticated() || req.user) {
        Question.findOne({ _id: req.params.questionId }, (err, ques) => {
            if (ques) {
                res.render("submit", { question: ques , login : req.user});
            }
            else res.send("<h1>404 not found ! </h1>")
        })
    } else res.redirect("/login");
});
app.post("/submit", (req, res) => {
    const newAnswer = new Answer({
        questionId: req.body.questionId,
        answer: req.body.answer
    });
    newAnswer.save();
    res.redirect("/questions/" + req.body.questionId);
});
app.get("/questions/:questionId", (req, res) => {
    Question.findOne({ _id: req.params.questionId }, (err, ques) => {
        if (ques) {
            Answer.find({ questionId: req.params.questionId }, (err, ans) => {
                res.render("question", { question: ques, answers: ans , login : req.user });
            });
        }
        else res.send("<h1>404 not found ! </h1>")
    })
});
app.get("/contact", (req, res) => {
    res.render("contact" , {login : req.user});
});
app.get("/login", (req, res) => {
    res.render("login" , {login : req.user});
});
app.post("/login" , (req , res)=>{
    const user = new User({
        username : req.body.username , 
        password : req.body.password
    });
    req.login(user , err=>{
        if(err) res.redirect("/login");
        else 
        {
            passport.authenticate("local" , {failureRedirect : "/login"})(req, res , ()=>{
                res.redirect("/");
            })
        }
    })
});
app.get("/logout" , (req , res)=>{
    req.logout();
    res.redirect("/");
});
app.get("/interestedtopic", (req, res) => {
    res.render("interestedTopic" , {login : req.user});
});
app.post("/interestedtopic", (req, res) => {
    // console.log(Object.keys(req.body));
    res.render("signup" , {topics : Object.keys(req.body) , login : req.user});
});
app.post("/signup", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) console.log(err);
        else {
            user.topics = req.body.topics.split(",");
            user.save();
            passport.authenticate("local")(req, res, () => {
                res.redirect("/");
            })
        }
    })
});
app.get("/newquestion", (req, res) => {
    if (req.isAuthenticated() || req.user ) {
        res.render("newquestion" , {login : req.user});
    }
    else res.redirect("/login");    
});
app.post("/newquestion", (req, res) => {
    const question = new Question({
        topic: req.body.topic,
        heading: req.body.heading,
        discription: req.body.question
    });
    question.save();
    res.redirect("/questions");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard" , {login : req.user});
});

app.listen(3000, () => {
    console.log("server started at given port!");
});
