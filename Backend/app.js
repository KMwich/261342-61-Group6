const express = require("express");
const path = require("path");
const mysql = require("mysql")
const Database = require("./database")

const app = express()
app.use(express.json())
app.use(express.urlencoded())
const port = 3000;

const db = new Database(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});

const connect = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "group6"
});

connect.connect(err => {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;
    }

    console.log("connected as id " + connect.threadId);
});

app.get("/", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/login.html"));
});

app.post("/login", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    connect.query('select * from login where username = ? and password = ?', [user, pass], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            if (result[0].office_id) {
                
            } else {
                connect.query('select * from Customers where ID = ?', [result[0].Customers_ID], (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({
                            name: result[0].first_name + result[0].sur_name,
                            customerID: result[0].ID
                        })
                    }
                })
            }
        }
    })
});

app.use(function(req, res){
    res.sendStatus(404);
});
