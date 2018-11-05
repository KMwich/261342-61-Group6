const express = require("express");
const path = require("path");
const orm = require("orm");
const jwt = require("jsonwebtoken")
const { models } = require("./database")
const ejs = require('ejs'),

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))
const port = 3000;

app.use(orm.express("mysql://root:@localhost/group6", models))

app.get("/", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/login.html"));
});

app.post("/login", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    req.models.login.get(user, (err, result) => {
        if (err) {
            console.log('Not found Username: ' + user)
            res.sendStatus(403)
        }else{
            if (result.password === pass) {
                const token = {
                    admin: result.admin,
                    position: result.position,
                    officer_id: result.officer_id,
                    customer_id: result.customer_id
                }
                if (result.officer_id) {
                    req.models.officers.get(result.officer_id, (err, result) => {
                        res.status(200).send({
                            token: jwt.sign(token, "group6")
                        })
                    })
                } else {
                    req.models.customers.get(result.customer_id, (err, result) => {
                        res.status(200).send({
                            token: jwt.sign(token, "group6")
                        })
                    })
                }
            } else {
                res.sendStatus(401)
            }
        }
    })
});

app.use(function(req, res){
    res.sendStatus(404);
});
app.get("/custommer", (req, res) => {
    var token =decryp(req.header["Authorization"])
    req.models.customers.get(token.customer_id,(err, result) => {
        if (err) {
            console.log('Not found Custommer ' + user)
            res.sendStatus(403)
        }else{
            var html = ejs.render('<%= people.join(", "); %>', {
                fname :result.fname,
                lname : result.lname,
                DOB : result.DOB,
                gender : result.gender,
                phone : result.phone,
                ID : result.ID,
                homeaddress : result.homeaddress,
                workaddress : result.workaddress
            });
            
        }
    })
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/Customer/CustommerView.html"));
});

const decryp = function(token){
    return jwt.verify(token, 'group6');
}

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))