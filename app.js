//jshint esversion:6

// ........installed package being used here ......
require('dotenv').config();
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findorcreate = require("mongoose-findorcreate");


//..........defining files ........................
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.set('useCreateIndex', true);

// .........making connection to mongoose..........

app.use(session({
  secret: 'my secret is cricket',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Shashikant__123:Gautam99@cluster0.cqnft.mongodb.net/secretDB?retryWrites=true&w=majority",
{useNewUrlParser: true },
{useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username : String,
    password :String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findorcreate);
const user = new mongoose.model("User",userSchema);




// use static serialize and deserialize of model for passport session support
passport.use(user.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
//............google passport...................
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//...........facebook passport..................
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET_ID,
    callbackURL: "http://localhost:8000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// .........get method for home page..............
app.get("/",function(req,res){
    res.render("home");
});

//..........google login.........................
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: "/login" }),
function(req, res) {
  res.redirect('/secrets');
});


//............facebook login....................
app.get('/auth/facebook',
  passport.authenticate('facebook',{ scope: ["public_profile"] }));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    if (err){
      console.log(err)
    }else{
      console.log(res);
    res.redirect('/secrets');
  }});


//...........getting to login page...............
app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){
    const newuser = new user({
        username : req.body.username,
        password : req.body.password
    });
    req.login(newuser,function(err){
        if (err){
            res.send(err);
        }else{
            passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })
    }
    });
});
    




//...........getting register page................
app.get("/register",function(req,res){
    res.render("register");
});



//............posting from register page..........
app.post("/register",function(req,res){
       user.register({username:req.body.username},req.body.password,function(err,user){
       if(err){
        res.send(err)
       }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
});
});
//............Submmiting Page....................
app.get("/submit",function(req,res){

    if (req.isAuthenticated()){
        res.render("submit");
   }else{
       res.redirect("/login");
   }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    const userId = req.user.id;
    user.findById(userId,function(err,result){
        if (err){
            console.log(err);
        }else{
            result.secret = submittedSecret;
            result.save(function(){
                res.redirect("/secrets");
            });
        }
    });
});

//................Secret page.....................

app.get("/secrets",function(req,res){   
    user.find({"secret":{$ne:null}},function(err,result){
        if (err){
            console.log(err);
        }else{
            res.render("secrets",{userWithSecret:result});
        }
    });
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

//...........starting server......................
app.listen(8000,function(){
    console.log("your sever is running on localhost:8000/");
});