//jshint esversion:6

// ........installed package being used here ......
require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


console.log(process.env.SECRET);

//..........defining files ........................
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

// .........making connection to mongoose..........
mongoose.connect("mongodb+srv://Shashikant__123:Gautam99@cluster0.cqnft.mongodb.net/secretDB?retryWrites=true&w=majority",
{useNewUrlParser: true },
{useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email : String,
    password :String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ["password"]});

const userModel = mongoose.model("User",userSchema);


// .........get method for home page..............
app.get("/",function(req,res){
    res.render("home");
});

//...........getting to login page...............
app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){
    const Email = req.body.email;
    const Password = req.body.password;
    userModel.findOne({email:Email},function(err,result){
        if (err){
            console.log(err);
        }else{
            if (result){
                console.log(result);
                if (result.password===Password){
                    res.render("secrets");

                }else{
                    res.send("Password does not matched.")
                }
       
    
        } else{
            res.send("Email is not registered.")
        }
    }});
});


//...........getting register page................
app.get("/register",function(req,res){
    res.render("register");
});

//............posting from register page..........
app.post("/register",function(req,res){
    const newUser = new userModel({
        email:req.body.email,
        password:req.body.password
    })
    newUser.save(function(err,result){
        if (err){
            console.log(err);
        }else{
            res.render("secrets");

        }
    })
})


app.get("/logout",function(req,res){
    res.redirect("/");
})

//...........starting server......................
app.listen(8000,function(){
    console.log("your sever is running on localhost:8000/");
});