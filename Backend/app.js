const express = require("express");
const path = require("path");
const orm = require("orm");
const jwt = require("jsonwebtoken")
const { models } = require("./database")

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

app.get("/admin", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/admin.html"));
});

app.post("/admin", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    const admin = req.body.admin
    const position = req.body.position
    req.models.officers.create({},(err, result) => {  
        if (err) {
            console.log('add officer failed' + user)
            res.sendStatus(403)
        }else{
            req.models.login.create({ username: user, password: pass, admin: admin, 
                position: position}, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add officer failed' + user)
                        res.sendStatus(403)
                    })
                } else {
                    res.sendStatus(200);
                }
            })
        }
    })     
});

app.get("/officer", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/createcustomer.html"));
});

app.post("/createcustomer", (req, res) => {
    const id = req.body.id  
    const fname = req.body.fname
    const lname = req.body.lname
    const work = req.body.workaddress
    const dob = req.body.DOB
    const home = req.body.homeaddress
    const phone = req.body.phone
    const gen = req.body.gender
    const user = req.body.username
    const pass = req.body.password
    req.models.customers.create({ id: id, fname: fname, lname: lname, workaddress: work,                     
    DOB: dob, homeaddress: home, phone: phone, gender: gen  },(err, result) => {  
        if (err) {
            console.log('add customer failed' + id)
            res.sendStatus(403)
        }else{
            req.models.login.create({ username: user, password: pass, customer_id: id}, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add customer failed' + id)
                        res.sendStatus(403)
                    })
                } else {
                    res.sendStatus(200);
                }
            })
        }
    })     
});


app.get("/createLoan", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/crateLoan.html"));
});

app.post("/createLoan", (req, res) => {
    const cus_id = req.body.customer_id
    const amount = req.body.amount
    const payback = req.body.payback
    const rate = req.body.interest_rate
    const asset = req.body.asset
    const date = Date.now()
    req.models.loan.create({ amount: amount, interest_rate: rate, Date: date, asset: asset, 
    payback: payback, customer_id: cus_id }, (err, result) => {  
        if (err) {
            console.log('add loan failed')
            res.sendStatus(403)
        }else{
            res.sendStatus(200);
        }
    })     
});

app.get("/customerList", (req, res) => {
    res.setHeader("Content-type", "text/html");
    res.sendFile(path.join(__dirname + "/../Frontend/customerList.html"));
    req.models.customers.find( true, (err, res) => {
        if (err) {
            console.log("Failed show customer")
            res.sendStatus(403)
        }else{
            res.sendStatus(200);
        }
    })
});


// app.get("/calender", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/calender.html"));
// });



// app.get("/tracking", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/tracking.html"));
// });



// app.get("/customer", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/customer.html"));
// });



// app.get("/request_list", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/request_list.html"));
// });



// app.get("/loan", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/loan.html"));
// });



// app.get("/account", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/account.html"));
// });



// app.get("/transaction", (req, res) => {
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/transaction.html"));
// });


app.use(function(req, res){
    res.sendStatus(404);
});

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))