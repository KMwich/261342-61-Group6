const express = require("express");
const path = require("path");
const Database = require("./database")

const app = express()
app.use(express.json())
app.use(express.urlencoded())
const port = 3000;

const db = new Database(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});

app.get("/", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/login.html"));
});

app.post("/login", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    db.login.find({username: user, password: pass}, (err, result) => {
        if (err) {
            console.log(err)
        }else{
            if (result.length === 0) {
                res.sendStatus(401)
            } else {
                if (result[0].officer_id) {
                    db.officers.find({ id : result[0].officer_id }, (err, result) => {
                        res.status(200).send({
                            name: result[0].fname + ' ' + result[0].lname,
                            officer_id: result[0].id
                        })
                    })
                } else {
                    db.customers.find({ id : result[0].customer_id }, (err, result) => {
                        res.status(200).send({
                            name: result[0].fname + ' ' + result[0].lname,
                            customer_id: result[0].id
                        })
                    })
                }
            }
        }
    })
});

app.use(function(req, res){
    res.sendStatus(404);
});
