require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const { use } = require('passport');
const { mail } = require(__dirname + '/mailer');
const Question = require('./models/question');
const Answer = require('./models/answer');
const User = require('./models/user');
const Voter = require('./models/voter');
const NewsletterUser = require('./models/newsLetter');
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
app.use(express.urlencoded({ extended: true }));


// passport intialization to use session and all
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://" + process.env.PASS + "@cluster0.kjv0j.mongodb.net/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/AsknitrrDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);


//passport strategy
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


//routes
app.get("/", (req, res) => {
    Question.aggregate([{ $sample: { size: 6 } }], (err, found) => {
        res.render("home", { questions: found, login: req.user });
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
app.post("/vote", (req, res) => {
    if (!req.isAuthenticated()) res.redirect("/login");
    else {

        const id = req.body.id;
        Question.findOne({ _id: id }, (err, found) => {
            if (found) {
                User.findOne({ _id: found.userId }, (err, user) => {
                    if (user) {
                        const vote = new Voter({
                            userId: req.user._id,
                            takenId: id
                        });
                        Voter.findOne({ userId: vote.userId, takenId: id }, (err, done) => {
                            if (!done) {
                                if (user.contribution) user.contribution++;
                                else user.contribution = 1;
                                if (found.vote) found.vote++;
                                else found.vote = 1;
                                found.save();
                                user.save();
                                vote.save();
                            }
                        });
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

// question routes
app.use(require('./routes/questionRoutes'));

