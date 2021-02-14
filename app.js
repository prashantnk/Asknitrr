require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { use } = require('passport');
const { mail } = require(__dirname + '/mailer');
const app = express();
app.set('trust proxy', 1); // trust first proxy
//setting up session for user
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
// passport intialization to use session and all
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://" + process.env.PASS + "@cluster0.kjv0j.mongodb.net/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
const answerSchema = new mongoose.Schema({
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String,
    userId: mongoose.Schema.Types.ObjectId,
    vote: Number
});
const questionSchema = new mongoose.Schema({
    topic: String,
    heading: String,
    discription: String,
    userId: mongoose.Schema.Types.ObjectId,
    vote: Number
});
const userSchema = new mongoose.Schema({
    topics: [String],
    username: String,
    password: String,
    fname: String,
    lname: String,
    contribution: Number
});
const NewsletterUserSchema = new mongoose.Schema({
    email: String
});
userSchema.plugin(passportLocalMongoose); // it will register user do salting and hashing
const Question = new mongoose.model("Question", questionSchema);
const Answer = new mongoose.model("Answer", answerSchema);
const User = new mongoose.model("User", userSchema);
const NewsletterUser = new mongoose.model("NewsletterUser", NewsletterUserSchema);
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
    Question.aggregate([{ $sample: { size: 6 } }], (err, found) => {
        res.render("home", { questions: found, login: req.user });
    })
});
app.get("/questions", (req, res) => {
    Question.find({}, (err, found) => {
        found.reverse();
        res.render("questions", { questions: found, login: req.user, topic: "" });
    })
});
app.get("/questions/topics/:topic", (req, res) => {
    Question.find({ topic: req.params.topic.toUpperCase() }, (err, found) => {
        //console.log(req.params.topic);
        found.reverse();
        res.render("questions", { questions: found, login: req.user, topic: req.params.topic });
    })
});
app.get("/submit/:questionId", (req, res) => {
    if (req.isAuthenticated() || req.user) {
        Question.findOne({ _id: req.params.questionId }, (err, ques) => {
            if (ques) {
                res.render("submit", { question: ques, login: req.user });
            }
            else res.send("<h1>404 not found ! </h1>")
        })
    } else res.redirect("/login");
});
app.post("/submit", (req, res) => {
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
app.get("/questions/:questionId", (req, res) => {
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
app.get("/contact", (req, res) => {
    res.render("contact", { login: req.user });
});
app.get("/login", (req, res) => {
    res.render("login", { login: req.user });
});
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, err => {
        if (err) res.redirect("/login");
        else {
            passport.authenticate("local", { failureRedirect: "/login" })(req, res, () => {
                res.redirect("/");
            })
        }
    })
});
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});
app.get("/interestedtopic", (req, res) => {
    res.render("interestedTopic", { login: req.user });
});
app.post("/interestedtopic", (req, res) => {
    // console.log(Object.keys(req.body));
    res.render("signup", { topics: Object.keys(req.body), login: req.user });
});
app.post("/signup", (req, res) => {
    User.findOne({ username: req.body.username }, (err, found) => {
        if (found) {
            res.redirect("/login");
        }
        else {
            User.register({ username: req.body.username }, req.body.password, (err, user) => {
                if (err) console.log(err);
                else {
                    user.topics = req.body.topics.split(",");
                    user.fname = req.body.first;
                    user.lname = req.body.last;
                    user.contribution = 0;
                    user.save();
                    mail(process.env.ADMINMAIL, `user : ${user.fname} ${user.lname} , mail : ${user.username} , has registered !`, "someone registered on asknitrr");
                    mail(user.username, "you have been registered to ASKNITRR", "Registration Successfull");
                    passport.authenticate("local")(req, res, () => {
                        res.redirect("/");
                    })
                }
            })
        }
    })
});
app.get("/newquestion", (req, res) => {
    if (req.isAuthenticated() || req.user) {
        res.render("newquestion", { login: req.user });
    }
    else res.redirect("/login");
});
app.post("/newquestion", (req, res) => {
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

app.get("/dashboard", (req, res) => {
    res.render("dashboard", { login: req.user });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("server started at given port!");
});

app.post("/contact", (req, res) => {
    mail(process.env.ADMINMAIL, `from : ${req.body.name} , Text : ${req.body.message}`, "SOMEONE CONTACTED YOU");
    mail(req.body.email, "WE GOT YOUR MAIL! , WE WILL RESPOND YOU ASAP", "THANKS ! FOR CONTACTING US!");
    res.redirect(req.headers.referer);
});
app.post("/subscribe", (req, res) => {
    mail(req.body.email, "YOU will get our latest updates!", "THANKS ! for Subscribing US!");
    const NUser = new NewsletterUser({
        email: req.body.email
    });
    NUser.save();
    res.redirect(req.headers.referer);
});
app.post("/delete", (req, res) => {
    const id = req.body.id;
    Question.deleteOne({ _id: id }, (err) => { });
    Answer.deleteOne({ _id: id }, (err) => { });
    Answer.deleteMany({ questionId: id }, (err) => { });
    res.redirect(req.headers.referer);
})
app.post("/upvote", (req, res) => {
    if (!req.isAuthenticated()) res.redirect("/login");
    else {
        const id = req.body.id;
        Question.findOne({ _id: id }, (err, found) => {
            if (found) {
                if (found.vote) found.vote++;
                else found.vote = 1;
                found.save();
                User.findOne({ _id: found.userId }, (err, user) => {
                    if (user) {
                        if (user.contribution) user.contribution++;
                        else user.contribution = 1;
                        user.save();
                    }
                })
            }
        });
        Answer.findOne({ _id: id }, (err, found) => {
            if (found) {
                if (found.vote) found.vote++;
                else found.vote = 1;
                found.save();
                User.findOne({ _id: found.userId }, (err, user) => {
                    if (user) {
                        if (user.contribution) user.contribution++;
                        else user.contribution = 1;
                        user.save();
                    }
                })
            }
        });
        res.redirect(req.headers.referer);
    }
});

