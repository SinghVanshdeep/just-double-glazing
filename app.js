import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import sanitizeHTML from "sanitize-html";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const port = 3000;
const options = {allowedTags: [], allowedAttributes: {}}; // html sanitising options


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(
    mongoSanitize({
        allowDots: true,
    }),
);
// connecting to mongoose
mongoose.connect(`mongodb+srv://admin-vansh:${process.env.PASSWORD}@cluster0.qbxixox.mongodb.net/jdgCustomersDB`);

// making a user schema (how the customer data will be stored)
const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    phone: String,
    email: String,
    messages: [String]
});

// making a model/table based on the schema above
const User = mongoose.model("Customer", userSchema);

app.get("/", function(req, res){
    res.render("home.ejs"); 
});

app.post("/", async function(req, res){
    const firstName = sanitizeHTML(req.body.fName, options)
    const lastName = sanitizeHTML(req.body.lName, options)
    const userEmail = sanitizeHTML(req.body.email, options)
    const phoneNo = sanitizeHTML(req.body.phone, options)
    const userMessage = sanitizeHTML(req.body.message, options)

   
    // sending email of the user detail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_MAIL,
            pass: process.env.PASS_WD
        }
    });

    const filter = {email: userEmail, phone: phoneNo};
    const exists = await User.findOneAndUpdate(filter, {$push: {messages: userMessage}});

    if (!exists){
        const customer = new User({
            first_name: firstName,
            last_name: lastName,
            email: userEmail,
            phone: phoneNo,
            messages: userMessage
        });

        await customer.save();
    }

    const mailOptions = {
        from: process.env.MY_MAIL,
        to: process.env.MY_MAIL,
        subject: `Customer: ${firstName} ${lastName}`,
        text: `Customer Contact: \n${phoneNo}, \n${userEmail} \n\nMessage: \n${userMessage}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error){
            console.log(error);
        }else{
            console.log(`Email sent: ${info.response}`);
        }
    })


    res.redirect("/");
});

app.get("/about", function(req, res){
    res.render("about.ejs");
});


app.listen(process.env.PORT || port, function(){
    console.log("Server started");
})
