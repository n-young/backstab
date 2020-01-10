//=========================================
//DEPENDENCIES
//=========================================

const express = require('express');
const flash = require('express-flash');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const async = require('async');
const crypto = require('crypto');
const User = require('./models/user.js')
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://n-young:tetris101@spyvspy-ogfdo.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, {
    useNewUrlParser: true
});
client.connect(err => {
    const collection = client.db("spyvspy").collection("devices");
    client.close();
});
mongoose.connect(uri);

app.use(express.static("public"));
app.use(require("express-session")({
    secret: "__KEY__",
    resave: false,
    saveUninitialized: false
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const port = process.env.PORT;
//const port = 3000;

//=========================================
//ROUTES
//=========================================

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect("/user");
    }
    res.render("index.ejs", {
        regOverride: false
    });
})

app.get('/user', isLoggedIn, function (req, res) {
    res.render("user.ejs", {
        currentUser: req.user,
        gameOn: true
    });
    User.update({
        id: req.user.id
    }, {
        $set: {
            alert: ""
        }
    }, {
        upsert: false
    }, function (err) {
        if (err) {
            console.log("Failed to write user data.")
        }
    });
})

app.get('/registeryeet', function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect("/user");
    }
    res.render("index.ejs", {
        regOverride: true
    });
})

app.get('/nickyoungpage', function (req, res) {
    res.render("user.ejs", {
        currentUser: req.user,
        gameOn: true
    });
    User.update({
        id: req.user.id
    }, {
        $set: {
            alert: ""
        }
    }, {
        upsert: false
    }, function (err) {
        if (err) {
            console.log("Failed to write user data.")
        }
    });
});

//=========================================
//PUSH
//=========================================

app.post('/elimPing', function (req, res) {
    User.update({
        id: req.user.id
    }, {
        $set: {
            elimPing: true
        }
    }, {
        upsert: false
    }, function (err) {
        if (err) {
            console.log("Failed to write user data.")
        }
    });
    res.redirect("/");
});

app.post('/elimCancel', function (req, res) {
    User.update({
        id: req.user.id
    }, {
        $set: {
            elimPing: false
        }
    }, {
        upsert: false
    }, function (err) {
        if (err) {
            console.log("Failed to write user data.")
        }
    });
    res.redirect("/");
});

app.post('/elimConfirm', function (req, res) {
    if (req.body.elimValue == "confirm") {
        User.update({
            id: req.user.id
        }, {
            $set: {
                status: "eliminated"
            }
        }, {
            upsert: false
        }, function (err) {
            if (err) {
                console.log("Failed to write user data.")
            }
        });
    } else {
        User.update({
            id: req.user.id
        }, {
            $set: {
                status: "alive",
                adminAlert: true
            }
        }, {
            upsert: false
        }, function (err) {
            if (err) {
                console.log("Failed to write user data.")
            }
        });
    }
    res.redirect("/");
})

//=========================================
//LOGIN & REGISTRATION HANDLING
//=========================================

app.post('/register', function (req, res) {
    User.register(new User({
        username: req.body.username,
        name: req.body.name,
        id: req.body.studentId,
        phone: req.body.phone,
        paid: false,
        target: {
            name: "none",
            id: 0
        },
        due: "none",
        status: "alive",
        elimPing: false,
        alert: "",
        adminAlert: false
    }), req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                return res.render('error.ejs');
            }
            passport.authenticate("local")(req, res, function () {
                res.redirect("/user");
            })
        });
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/"
}), function (req, res) { })

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/")
});

//=========================================
//PW RESET HANDLING
//=========================================

app.get('/forgot', function (req, res) {
    res.render('forgot.ejs', {
        user: req.user
    });
});

app.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({
                username: req.body.email
            }, function (err, user) {
                if (!user) {
                    console.log("no account")
                    //req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: '__EMAIL__',
                    pass: '__PASSWORD__',
                }
            });
            var mailOptions = {
                to: user.username,
                from: process.env.FROM_EMAIL,
                subject: 'Spy V Spy Password Change',
                text: 'This email allows you to change your password.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with a link to change the password.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

app.get('/reset/:token', function (req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            //req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user,
            token: req.params.token
        });
    });
});


app.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!user) {
                    //req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    //req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: '__EMAIL__',
                    pass: '__PASSWORD__',
                }
            });
            var mailOptions = {
                to: user.username,
                from: process.env.FROM_EMAIL,
                subject: 'Spy V Spy - Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                //req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ],
        function (err) {
            res.redirect('/');
        });
});

app.get('*', function (req, res) {
    res.redirect('/');
})


//=========================================
//CONDITIONALS
//=========================================

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

//=========================================
//START
//=========================================

app.listen(port, function () {
    console.log("Server listening on port: " + port);
})