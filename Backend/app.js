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
                    var redirect = ""
                    if (req.session.user.position) {
                        redirect = "/dept"
                    } else {
                        redirect = "/crm"
                    }
                    req.models.officers.get(result.officer_id, (err, result) => {
                        req.session.name = result.fullname()
                        res.status(200).send({
                            redirect: redirect
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
        if (count === 0) {
            res.render('admin', { officers })
        }else{
            result.forEach(e => {
                var officer = {
                    id: e.id
                }
                if (e.fname != null) {
                    officer.name = e.fullname()
                }
                req.models.login.find({officer_id: e.id}, (err, result) => {
                    if (err) {
                        res.sendStatus(403)
                    } else {
                        if (result.length === 0) {
                            count -= 1
                        } else {
                            officer.username = result[0].username
                            if (result[0].position) {
                                officer.position = "DEPT"
                            } else {
                                officer.position = "CRM"
                            }
                            officers.push(officer)
                        }

                        if (officers.length == count) {
                            res.render('admin', { officers })
                        
                        }
                    }
                })
            })
        }
    })
});

app.post("/admin/createOfficer", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    const position = (req.body.position === "1")
    req.models.officers.create({},(err, result) => {
        const id = result.id
        if (err) {
            console.log('add officer failed ' + user)
            res.sendStatus(403)
        }else{
            req.models.login.create({ username: user, password: pass, 
                position: position, officer_id: id}, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add officer failed ' + user)
                        res.sendStatus(403)
                    })
                } else {
                    res.sendStatus(200);
                }
            })
        }
    })     
});

app.post("/officer", (req, res) => {
    const fname = req.body.fname
    const lname = req.body.lname
    const gender = req.body.gender
    const ssn = req.body.ssn
    req.models.officers.get(req.session.user.officer_id, (err, result) => {
        if (err) {
            console.log('Edit officer failed')
            res.sendStatus(403)
        } else {
            result.fname = fname
            result.lname = lname
            result.gender = gender
            result.ssn = ssn
            result.save((err, result) => {
                if (err) {
                    console.log('Edit officer failed')
                    res.sendStatus(403)
                } else {
                    if (req.session.user.position) {
                        req.models.depts.create({id: result.id, fname: result.fname, lname: result.lname, 
                        gender: result.gender, ssn: result.ssn}, (err, result) => {
                            if (err) {
                                console.log('Edit officer failed')
                                res.sendStatus(403)
                            } else {
                                res.sendStatus(200)
                            }
                        })
                    } else {
                        req.models.crms.create({id: result.id, fname: result.fname, lname: result.lname, 
                        gender: result.gender, ssn: result.ssn}, (err, result) => {
                            if (err) {
                                console.log('Edit officer failed')
                                res.sendStatus(403)
                            } else {
                                res.sendStatus(200)
                            }
                        })
                    }
                }
            })
        }
    })     
});

app.get("/crm", (req, res) => {
    req.models.customers.find(true, (err, result) => {
        var customers = []
        result.forEach(e => {
            customer = {
                id: e.id,
                account: e.ssn,
                name: e.fullname()
            }
            customers.push(customer)
        })
        res.render('crm/CustomerList', {customers})
    })
});

app.get("/crm/customerList", (req, res) => {
    req.models.customers.find(true, (err, result) => {
        var customers = []
        result.forEach(e => {
            customer = {
                id: e.id,
                name: e.fullname()
            }
            customers.push(customer)
        })
        res.render('crm/CustomerList', {customers})
    })
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
    const gen = (req.body.gender === "1")
    const user = req.body.username
    const pass = req.body.password
    req.models.customers.create({ ssn: id, fname: fname, lname: lname, workaddress: work,                     
    DOB: dob, homeaddress: home, phone: phone, gender: gen, balance: 0 },(err, result) => {  
        if (err) {
            console.log('add customer failed ' + id)
            res.sendStatus(403)
        }else{
            req.models.login.create({ username: user, password: pass, customer_id: result.id}, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add customer failed ' + id)
                        res.sendStatus(403)
                    })
                } else {
                    req.models.account.create({customer_id: result1.customer_id, amount: 0}, (err, result2) => {
                        if (err) {
                            result1.remove((err) => {
                                result.remove((err) => {
                                    console.log('add customer failed ' + id)
                                    res.sendStatus(403)
                                })
                            })
                        } else {
                            res.sendStatus(200);
                        }
                    })
                }
            })
        }
    })     
});

app.get("/crm/editCustomer/:id", (req, res) => {
    req.models.customers.get(req.params.id, (err, customer) => {
        if (err) {
            res.sendStatus(404)
        } else {
            customer.DOB = formatDate(customer.DOB)
            res.render('crm/EditCustomer', {customer})
        }
    })
});

app.post("/crm/editCustomer/:id", (req, res) => {
    const fname = req.body.fname
    const lname = req.body.lname
    const work = req.body.workaddress
    const dob = req.body.DOB
    const home = req.body.homeaddress
    const phone = req.body.phone
    const gender = (req.body.gender === "1")
    const ssn = req.body.ssn
    req.models.customers.get(req.params.id, (err, result) => {
        if (err) {
            console.log('Edit customer failed')
            res.sendStatus(403)
        } else {
            result.fname = fname
            result.lname = lname
            result.workaddress = work
            result.DOB = dob
            result.homeaddress = home
            result.phone = phone
            result.gender = gender
            result.ssn = ssn
            result.save((err, result) => {
                if (err) {
                    console.log('Edit customer failed')
                    res.sendStatus(403)
                } else {
                    res.sendStatus(200) 
                }
            })
        }
    })
});

app.get("/crm/loanList", (req, res) => {
    var loans = []
    var count = 0
    req.models.loan.find( true, (err, result) => {
        if (err) {
            res.sendStatus(403)
        }else{
            count = result.length
            if (count === 0){
                res.render('crm/Loanlist', {loans})
            }else{
                result.forEach(e => {
                    var loan = {
                        id: e.id,
                        amount: e.amount,
                        time: formatTime(e.time),
                        asset: e.asset,
                        payback: e.payback
                    }
                    req.models.customers.get(e.customer_id, (err, result) => {
                        if (err) {
                            res.sendStatus(403)
                        } else {
                            loan.name = result.fullname()
                            loans.push(loan)
                            if (loans.length === count) {
                                res.render('crm/Loanlist', {loans})
                            }
                        }
                    })
                })
            }
        }
    })
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
    const timestamp = Date.now()
    const date = formatDate(Date(timestamp)) + ' ' + formatTime(Date(timestamp))
    req.models.loan.create({ amount: amount, interest_rate: rate, time: date, asset: asset, 
    payback: payback, customer_id: cus_id }, (err, result) => {  
        if (err) {
            console.log('add loan failed')
            res.sendStatus(403)
        }else{
            res.sendStatus(200);
        }
    })     
});

app.get("/crm/loanEdit/:id", (req, res) => {
    req.models.loan.get(req.params.id, (err, result) => {
        if (err) {
            res.sendStatus(403)
        } else {
            loan = {
                id: result.id,
                amount: result.amount,
                rate: result.interest_rate,
                payback: result.payback,
                asset: result.asset
            }
            res.render('crm/LoanEdit', {loan})
        }
    })
});

app.post("/crm/loanEdit/:id", (req, res) => {
    const amount = req.body.amount
    const payback = req.body.payback
    const rate = req.body.interest_rate
    const asset = req.body.asset
    req.models.loan.get(req.params.id, (err, result) => {
        if (err) {
            console.log('Edit loan failed')
            res.sendStatus(403)
        } else {
            result.amount = amount
            result.interest_rate = rate
            result.asset = asset
            result.payback = payback
            result.save((err, result) => {
                if (err) {
                    console.log('Edit loan failed')
                    res.sendStatus(403)
                } else {
                    res.sendStatus(200) 
                }
            })
        }
    })
});

app.get("/crm/DoW", (req, res) => {
    res.render('crm/DepositWithdraw', {customer: undefined})
});

app.get("/crm/DoW/:id", (req, res) => {
    req.models.customers.get(req.params.id, (err, result) => {
        if (err) {
            res.render('crm/DepositWithdraw', {customer: undefined})
        } else {
            var customer = {
                id: req.params.id,
                name: result.fullname(),
                dept: 0
            }
            req.models.account.get(req.params.id, (err, result) => {
                if (err) {
                    customer.balance = 0
                } else {
                    customer.balance = result.amount
                }
                req.models.loan.find({customer_id: customer.id}, (err, result) => {
                    if (err) {
                        res.render('crm/DepositWithdraw', {customer: undefined})
                    } else {
                        result.forEach(e => {
                            customer.dept += e.amount
                        })
                        res.render('crm/DepositWithdraw', {customer})
                    }
                })
            })
        }
    })
    
})

app.post("/crm/Dow", (req, res) => {
    const id = +req.body.id
    const dow = (req.body.dow === "0")
    const amount = +req.body.amount
    req.models.account.get(id, (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(403)
        } else {
            if (dow) {
                result.amount += amount
                result.save((err) => {
                    if (err) {
                        res.sendStatus(403)
                    } else {
                        const timestamp = Date.now()
                        const date = formatDate(Date(timestamp)) + ' ' + formatTime(Date(timestamp))
                        req.models.transaction.create({customer_id: id, date: date, amount: amount}, (err, result) => {
                            if (err) {
                                res.sendStatus(403)
                            } else {
                                res.sendStatus(200)
                            }
                        })
                    }
                })
            } else {
                if (result.amount < amount) {
                    res.sendStatus(403)
                } else {
                    result.amount -= amount
                    result.save((err) => {
                        if (err) {
                            res.sendStatus(403)
                        } else {
                            const timestamp = Date.now()
                            const date = formatDate(Date(timestamp)) + ' ' + formatTime(Date(timestamp))
                            req.models.transaction.create({customer_id: id, date: date, amount: -amount}, (err, result) => {
                                if (err) {
                                    res.sendStatus(403)
                                } else {
                                    res.sendStatus(200)
                                }
                            })
                        }
                    })
                }
            }
        }
    })
});


app.get("/dept", (req, res) => {
    req.models.loan.find(true, (err, result) => {
        if (err) {
            res.sendStatus(403)
        } else {
            var loans = []
            var count = result.length
            result.forEach(e => {
                loan = {
                    id: e.id,
                    amount: e.amount,
                    payback: e.payback
                }
                req.models.customers.get(e.customer_id, (err, result) => {
                    loan.name = result.fullname()
                    loans.push(loan)
                    if (loans.length === count) {
                        res.render('dept/ToDoList', {loans})
                    }
                })
            })
        }
    })
})

app.get("/dept/toDoList", (req, res) => {
    res.render('dept/ToDoList')
});


app.post("/dept/toDoList", (req, res) => {
});

app.get("/dept/trackLoan", (req, res) => {
    res.render('dept/TrackTheLoan')
});

app.post("/dept/trackLoan", (req, res) => {

});


app.get("/customer", (req, res) => {
    customerView(req, res)
})

app.get("/customer/information", (req, res) => {
    customerView(req, res)
})

function customerView(req, res) {
    var customer = {}
    req.models.customers.get(req.session.user.customer_id,(err,result) =>{
        if(err){
            res.sendStatus(403)
        }else{
            req.models.account.get(result.id, (err, result2) => {
                customer.balance = 0
                if (err) {
                    res.sendStatus(401)
                } else {
                    customer.balance = result2.amount
                }
                req.models.loan.find({customer_id: result.id}, (err, result3) => {
                    customer.dept = 0
                    if (err) {
                        res.sendStatus(401)
                    } else {
                        result3.forEach(e => {
                            customer.dept += e.amount
                        })
                    }
                    res.render('Customer/CustomerView',{firstname:result.fname,surname:result.lname,date:formatDate(result.DOB),gender:result.gender,
                        phone:result.phone,id:result.ssn,homeaddress:result.homeaddress,workaddress:result.workaddress, blance: customer.balance, deptblance: customer.dept})
                        console.log(result.fullname())
                })
            })     
        }
    }) 
}

app.get("/customer/transaction", (req, res) => {
    var transactions = []
    var count = 0
    req.models.transaction.find({customer_id: req.session.user.customer_id},(err,result) => {
        if(err){
            res.render('Customer/transaction',{transactions})
        }else{
            console.log(result.amount)
            count = result.length
            if (count === 0) {
                res.render('Customer/transaction',{transactions})
            } else {
                result.forEach(e =>{
                    var transaction = {
                        amount: changeBalance(e.amount),
                        date:formatDate(e.date)+' '+formatTime(e.date),
                        type:typeTransaction(e.amount)
                    }   
                    transactions.push(transaction)
                    if(count === transactions.length){
                        res.render('Customer/transaction',{transactions})
                    } 
                })
            }
        }
    })  
})

app.get("/customer/ask", (req, res) => {
    res.render('Customer/Ask')
})

// app.get("/custommer", (req, res) => {
//     var token =decryp(req.header["Authorization"])
//     req.models.customers.get(token.customer_id,(err, result) => {
//         if (err) {
//             console.log('Not found Custommer ' + user)
//             res.sendStatus(403)
//         }else{
//             var html = ejs.render('<%= people.join(", "); %>', {
//                 fname :result.fname,
//                 lname : result.lname,
//                 DOB : result.DOB,
//                 gender : result.gender,
//                 phone : result.phone,git
//                 ID : result.ID,
//                 homeaddress : result.homeaddress,
//                 workaddress : result.workaddress
//             });
            
//         }
//     })
//     res.setHeader("Content-type", "text/html");
//     res.sendFile(path.join(__dirname + "/../Frontend/Customer/CustommerView.html"));
// });

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function formatTime(time) {
    var t = new Date(time),
        hour = '' + t.getHours(),
        min = '' + t.getMinutes(),
        sec = '' + t.getSeconds();

    if (hour.length < 2) hour = '0' + hour;
    if (min.length < 2) min = '0' + min;
    if (sec.length < 2) sec = '0' + sec;

    return [hour, min, sec].join(':')
}
function typeTransaction(number){
    if(number>0){
        return 'Deposit'
    }else{
        return 'Widthdraw'
    }
}
function changeBalance(number){
    if(number>0){
        return number
    }else{
        return -number
    }
}

app.use(function(req, res){
    res.sendStatus(404);
});

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))