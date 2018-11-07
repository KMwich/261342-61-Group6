const express = require("express");
const path = require("path");
const orm = require("orm");
const { models } = require("./database")
const session = require("express-session")

const app = express()
const port = 3000;

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(orm.express("mysql://root:@localhost/group6", models))
app.use(session({  
    secret: 'group6',
    resave: true,
    saveUninitialized: true
}))
app.set('view engine', 'ejs')

app.get("/", (req, res) => {
    res.render('login');
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
                req.session.user = {
                    admin: result.admin,
                    position: result.position,
                    officer_id: result.officer_id,
                    customer_id: result.customer_id
                }
                if (result.officer_id) {
                    req.models.officers.get(result.officer_id, (err, result) => {
                        req.session.name = result.fullname()
                        res.status(200).send({
                            redirect: "/crm"
                        })
                    })
                } else {
                    req.models.customers.get(result.customer_id, (err, result) => {
                        req.session.name = result.fullname()
                        res.status(200).send({
                            redirect: "/customer"
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
    var officers = []
    var count = 0
    req.models.officers.find(true, (err, result) => {
        count = result.length
        result.forEach(e => {
            var officer = {
                id: e.id,
                name: e.fullname()
            }
            req.models.login.find({officer_id: e.id}, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    officer.username = result[0].username
                    if (BufferToString(result[0].position) === "0") {
                        officer.position = "CRM"
                    } else {
                        officer.position = "DEPT"
                    }
                    officers.push(officer)
                    if (officers.length == count) {
                        res.render('admin', { officers })
                    }
                }
            })
        })
    })
});

app.post("/admin/createOfficer", (req, res) => {
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

app.get("/crm", (req, res) => {
    res.render('crm/CustomerList')
});

app.get("/crm/customerList", (req, res) => {
    res.render('crm/CustomerList')
});

app.get("/crm/createCustomer", (req, res) => {
    res.render('crm/CreateCustomer')
});

app.post("/crm/createCustomer", (req, res) => {
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

app.get("/crm/editCustomer/:id", (req, res) => {
    res.render('crm/EditCustomer')
});

app.post("/crm/editCustomer/:id", (req, res) => {
    req.models.customers.get(this.id, (err, result) => {  
        if (err) {
            console.log("Don't has customer_id")
            res.sendStatus(403)
        }else{
            
        }
    })
});

app.get("/crm/loanList", (req, res) => {
    res.render('crm/LoanList')
    // req.models.loan.find( true, (err, res) => {
    //     if (err) {
    //         console.log("Failed show loan")
    //         res.sendStatus(403)
    //     }else{
    //         res.sendStatus(200);
    //     }
    // })
});

app.get("/crm/createLoan", (req, res) => {
    res.render('crm/createLoan')
});

app.post("/crm/createLoan", (req, res) => {
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

app.get("/crm/loanEdit/:id", (err, res) => {
    res.render('crm/LoanEdit')
});

app.post("/crm/loanEdit/:id", (err, res) => {
    res.render('crm/LoanEdit')
});

app.get("/crm/DoW", (req, res) => {
    res.render('crm/DepositWithdraw')
});

app.post("/crm/Dow", (req, res) => {

});

app.get("/dept/toDoList", (req, res) => {
    res.render('dept/ToDoList')
});

app.get("/dept/trackLoan", (req, res) => {
    res.render('dept/TrackTheLoan')
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

function BufferToString(buffer) {
    return buffer.toJSON().data.toString();
}

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))