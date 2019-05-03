//=========================================
//DEPENDENCIES
//=========================================

const express = require('express');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
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
    secret: "my goodness this code is very janky",
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

//const port = process.env.PORT;
const port = 3000;
//=========================================
//ROUTES
//=========================================

app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        return res.redirect("/user");
    }
    res.render("index.ejs");
})

app.get('/payment', isLoggedIn, function(req, res) {
    res.render("payment.ejs", {
        currentUser: req.user
    });
})

app.get('/grace', isLoggedIn, isPaid, function(req, res) {
    res.render('grace.ejs', {
        currentUser: req.user
    });
})

app.get('/user', isLoggedIn, isPaid, function(req, res) {
    res.render("user.ejs", {
        currentUser: req.user,
        gameOn: false
    });
    User.update({
        id: req.user.id
    }, {
        $set: {
            alert: ""
        }
    }, {
        upsert: false
    }, function(err) {
        if (err) {
            console.log("failed to write userdata")
        }
    });
})

app.get('/nickyoungpage', function(req, res) {
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
    }, function(err) {
        if (err) {
            console.log("failed to write userdata")
        }
    });
});

//=========================================
//PUSH
//=========================================

app.post('/elimPing', function(req, res) {
    User.update({
        id: req.user.id
    }, {
        $set: {
            elimPing: true
        }
    }, {
        upsert: false
    }, function(err) {
        if (err) {
            console.log("failed to write userdata")
        }
    });
    res.redirect("/");
});

app.post('/elimCancel', function(req, res) {
    User.update({
        id: req.user.id
    }, {
        $set: {
            elimPing: false
        }
    }, {
        upsert: false
    }, function(err) {
        if (err) {
            console.log("failed to write userdata")
        }
    });
    res.redirect("/");
});

app.post('/elimConfirm', function(req, res) {
    if (req.body.elimValue == "confirm") {
        User.update({
            id: req.user.id
        }, {
            $set: {
                status: "eliminated"
            }
        }, {
            upsert: false
        }, function(err) {
            if (err) {
                console.log("failed to write userdata")
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
        }, function(err) {
            if (err) {
                console.log("failed to write userdata")
            }
        });
    }
    res.redirect("/");
})

//=========================================
//LOGIN & REGISTRATION HANDLING
//=========================================

app.post('/register', function(req, res) {
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
            due: "May 13",
            status: "alive",
            elimPing: false,
            alert: "",
            adminAlert: false
        }), req.body.password,
        function(err, user) {
            if (err) {
                console.log(err);
                return res.render('error.ejs');
            }
            passport.authenticate("local")(req, res, function() {
                res.redirect("/user");
            })
        });
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/"
}), function(req, res) {})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/")
});

//=========================================
//CONDITIONALS
//=========================================

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

function isPaid(req, res, next) {
    if (req.user.paid === true) {
        return next();
    }
    res.redirect("/payment");
}

app.get('*', function(req, res) {
    res.redirect('/');
})

//=========================================
//START
//=========================================

app.listen(port, function() {
    console.log("Server listening on port: " + port);
})
