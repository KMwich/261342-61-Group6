const express = require("express");
const session = require("express-session")
const orm = require("orm");

const app = express()
const port = 3000;

var Database = {}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'group6',
    resave: true,
    cookie: {maxAge: 600000},
    saveUninitialized: true
}))
app.set('view engine', 'ejs')

app.get("/", (req, res) => {
    res.render('login');
});

app.get("logout", (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

app.post("/login", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    createDB(req)
    getDB(req).models.login.get(user, (err, result) => {
        if (err) {
            console.log('Not found Username: ' + user)
            redirect(req.session.user, res)
        } else {
            if (result.password === pass) {
                req.session.user = {
                    admin: result.admin,
                    position: result.position,
                    officer_id: result.officer_id,
                    customer_id: result.customer_id
                }
                if (result.officer_id) {
                    getDB(req).models.officers.get(result.officer_id, (err, result) => {
                        if (result.fname) {
                            req.session.user.name = result.fullname()
                        }
                        redirect(req.session.user, res)
                    })
                } else {
                    getDB(req).models.customers.get(result.customer_id, (err, result) => {
                        if (result.fname) {
                            req.session.user.name = result.fullname()
                        }
                        redirect(req.session.user, res)
                    })
                }
            } else {
                redirect(req.session.user, res)
            }
        }
    })
});

app.get("/admin", (req, res) => {
    if (checkUser(req.session, res, 'admin')) {
        var officers = []
        var count = 0
        getDB(req).models.officers.find(true, (err, result) => {
            count = result.length
            if (count === 0) {
                res.render('admin', { officers })
            } else {
                result.forEach(e => {
                    var officer = {
                        id: e.id
                    }
                    if (e.fname != null) {
                        officer.name = e.fullname()
                    }
                    getDB(req).models.login.find({ officer_id: e.id }, (err, result) => {
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
    }
});

app.post("/admin/createOfficer", (req, res) => {
    const user = req.body.username
    const pass = req.body.password
    const position = (req.body.position === "1")
    getDB(req).models.officers.create({}, (err, result) => {
        const id = result.id
        if (err) {
            console.log('add officer failed ' + user)
            res.redirect('/admin');
        } else {
            getDB(req).models.login.create({
                username: user, password: pass,
                position: position, officer_id: id
            }, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add officer failed ' + user)
                        res.redirect('/admin');
                    })
                } else {
                    res.redirect('/admin');
                }
            })
        }
    })
});

app.get("/editOfficer", (req, res) => {
    if (req.session.user) {
        if (req.session.user.name) {
            redirect(req.session.user, res)
        } else {
            res.render('edit-officer')
        }
    } else {
        res.redirect('/')
    }
})

app.post("/editOfficer", (req, res) => {
    const fname = req.body.fname
    const lname = req.body.lname
    const gender = (req.body.gender === '1')
    const ssn = req.body.ssn
    getDB(req).models.officers.get(req.session.user.officer_id, (err, result) => {
        if (err) {
            console.log('Edit officer failed')
            res.redirect('/editOfficer')
        } else {
            result.fname = fname
            result.lname = lname
            result.gender = gender
            result.ssn = ssn
            result.save((err, result) => {
                if (err) {
                    console.log('Edit officer failed')
                    res.redirect('/editOfficer')
                } else {
                    ((req.session.user.position)?getDB(req).models.debts:getDB(req).models.crms).create({
                        id: result.id, fname: result.fname, lname: result.lname,
                        gender: result.gender, ssn: result.ssn
                    }, (err, result) => {
                        if (err) {
                            console.log('Edit officer failed')
                            res.redirect('/editOfficer')
                        } else {
                            req.session.user.name = result.fullname()
                            redirect(req.session.user, res)
                        }
                    })
                }
            })
        }
    })
});

app.get(["/crm", "/crm/customerList"], (req, res) => {
    if (checkUser(req.session, res, 'crm')) {
        getDB(req).models.customers.find(true, (err, result) => {
            var customers = []
            result.forEach(e => {
                customer = {
                    id: e.id,
                    account: e.ssn,
                    name: e.fullname()
                }
                customers.push(customer)
            })
            res.render('crm/CustomerList', { customers })
        })
    }
});

app.get("/crm/createCustomer", (req, res) => {
    if (checkUser(req.session, res, 'crm')) {
        res.render('crm/CreateCustomer')
    }
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
    getDB(req).models.customers.create({
        ssn: id, fname: fname, lname: lname, workaddress: work,
        DOB: dob, homeaddress: home, phone: phone, gender: gen, balance: 0
    }, (err, result) => {
        if (err) {
            console.log('add customer failed ' + id)
            res.sendStatus(403)
        } else {
            getDB(req).models.login.create({ username: user, password: pass, customer_id: result.id }, (err, result1) => {
                if (err) {
                    result.remove((err) => {
                        console.log('add customer failed ' + id)
                        res.sendStatus(403)
                    })
                } else {
                    getDB(req).models.account.create({ customer_id: result1.customer_id, amount: 0 }, (err, result2) => {
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
    if (checkUser(req.session, res, 'crm')) {
        getDB(req).models.customers.get(req.params.id, (err, customer) => {
            if (err) {
                res.sendStatus(404)
            } else {
                customer.DOB = formatDate(customer.DOB)
                res.render('crm/EditCustomer', { customer })
            }
        })
    }
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
    getDB(req).models.customers.get(req.params.id, (err, result) => {
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
    if (checkUser(req.session, res, 'crm')) {
        var loans = []
        var count = 0
        getDB(req).models.loan.find(true, (err, result) => {
            if (err) {
                res.sendStatus(403)
            } else {
                count = result.length
                if (count === 0) {
                    res.render('crm/Loanlist', { loans })
                } else {
                    result.forEach(e => {
                        var loan = {
                            id: e.id,
                            amount: e.amount,
                            time: formatDate(e.time) + ' ' + formatTime(e.time),
                            asset: e.asset,
                            payback: e.payback
                        }
                        getDB(req).models.customers.get(e.customer_id, (err, result) => {
                            if (err) {
                                res.sendStatus(403)
                            } else {
                                loan.name = result.fullname()
                                loans.push(loan)
                                if (loans.length === count) {
                                    res.render('crm/Loanlist', { loans })
                                }
                            }
                        })
                    })
                }
            }
        })
    }
});

app.get("/crm/createLoan", (req, res) => {
    if (checkUser(req.session, res, 'crm')) {
        res.render('crm/createLoan')
    }
});

app.post("/crm/createLoan", (req, res) => {
    const cus_id = req.body.customer_id
    const amount = req.body.amount
    const payback = req.body.payback
    const rate = req.body.interest_rate
    const asset = req.body.asset
    const timestamp = Date.now()
    const date = formatDate(Date(timestamp)) + ' ' + formatTime(Date(timestamp))
    getDB(req).models.customers.get(cus_id, (err, result) => {
        if (err) {
            console.log('add loan failed')
            res.sendStatus(403)
        } else {
            getDB(req).models.loan.create({
                amount: amount, interest_rate: rate, time: date, asset: asset,
                payback: payback, customer_id: cus_id
            }, (err, result) => {
                if (err) {
                    console.log('add loan failed')
                    res.sendStatus(403)
                } else {
                    res.sendStatus(200);
                }
            })
        }
    })
});

app.get("/crm/loanEdit/:id", (req, res) => {
    if (checkUser(req.session, res, 'crm')) {
        getDB(req).models.loan.get(req.params.id, (err, result) => {
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
                res.render('crm/LoanEdit', { loan })
            }
        })
    }
});

app.post("/crm/loanEdit/:id", (req, res) => {
    const amount = req.body.amount
    const payback = req.body.payback
    const rate = req.body.interest_rate
    const asset = req.body.asset
    getDB(req).models.loan.get(req.params.id, (err, result) => {
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
    if (checkUser(req.session, res, 'crm')) {
        res.render('crm/DepositWithdraw', { customer: undefined })
    }
});

app.get("/crm/DoW/:id", (req, res) => {
    if (checkUser(req.session, res, 'crm')) {
        getDB(req).models.customers.get(req.params.id, (err, result) => {
            if (err) {
                res.render('crm/DepositWithdraw', { customer: undefined })
            } else {
                var customer = {
                    id: req.params.id,
                    name: result.fullname(),
                    dept: 0
                }
                getDB(req).models.account.get(req.params.id, (err, result) => {
                    if (err) {
                        customer.balance = 0
                    } else {
                        customer.balance = result.amount
                    }
                    getDB(req).models.loan.find({ customer_id: customer.id }, (err, result) => {
                        if (err) {
                            res.render('crm/DepositWithdraw', { customer: undefined })
                        } else {
                            result.forEach(e => {
                                customer.dept += e.amount
                            })
                            res.render('crm/DepositWithdraw', { customer })
                        }
                    })
                })
            }
        })
    }
})

app.post("/crm/Dow", (req, res) => {
    const id = +req.body.id
    const dow = (req.body.dow === "0")
    const amount = +req.body.amount
    getDB(req).models.account.get(id, (err, result) => {
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
                        getDB(req).models.transaction.create({ customer_id: id, date: date, amount: amount }, (err, result) => {
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
                            getDB(req).models.transaction.create({ customer_id: id, date: date, amount: -amount }, (err, result) => {
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

app.get(["/debt", "/debt/toDoList"], (req, res) => {
    if (checkUser(req.session, res, 'debt')) {
        var loan_own = []
        var loans = []
        getDB(req).models.tracking.find({debt_id: req.session.user.officer_id},(err,result)=>{
            if (err) {
                res.render('dept/ToDoList', { loans })
            }
            result.forEach(e =>{
                loan_own.push(e.loan_id)
            })
            getDB(req).models.loan.find((loan_own.length !== 0)? {id: orm.not_in(loan_own)}:true, (err, result) => {
                if (err) {
                    res.render('dept/ToDoList', { loans })
                } else {
                    var count = result.length
                    if (result.length === 0) {
                        res.render('dept/ToDoList', { loans })
                    } else {
                        
                        result.forEach(e => {
                            var loan = {
                                id: e.id,
                                amount: e.amount,
                                payback: e.payback
                            }
                            
                            getDB(req).models.customers.get(e.customer_id, (err, result) => {
                                loan.name = result.fullname()
                                loans.push(loan)
                                if (loans.length === count) {
                                    res.render('dept/ToDoList', { loans })
                                }
                            })
                        })
                    }
                }
            })
        
        })
        
    }
})

app.post("/debt/toDoList", (req, res) => {
    var count = 0
    req.body.loans.forEach(id => {
        getDB(req).models.tracking.create({ loan_id: id, debt_id: req.session.user.officer_id }, (err, result) => {
            count++   
            if (count === req.body.loans.length) {
                res.sendStatus(200)
            }
        })
    })
});

app.get("/debt/trackLoan", (req, res) => {
    if (checkUser(req.session, res, 'debt')) {
        getDB(req).models.tracking.find({ debt_id: req.session.user.officer_id }, (err, result) => {
            if (err) {
                res.render('dept/TrackTheLoan')
            } else {
                var loans = []
                var count = result.length
                if (result.length === 0) {
                    res.render('dept/TrackTheLoan', { loans })
                } else {
                    result.forEach(e => {
                        var loan = {
                            id: e.loan_id
                        }
                        getDB(req).models.loan.get(e.loan_id, (err2, result2) => {
                            loan.amount = result2.amount
                            getDB(req).models.customers.get(result2.customer_id, (err3, result3) => {
                                loan.name = result3.fullname()
                                loans.push(loan)
                                if (loans.length === count) {
                                    res.render('dept/TrackTheLoan', { loans })
                                }
                            })
                        })
                    })
                }
            }
        })
    }
});

app.get(["/customer", "/customer/information"], (req, res) => {
    if (checkUser(req.session, res, 'customer')) {
        var customer = {}
        getDB(req).models.customers.get(req.session.user.customer_id, (err, result) => {
            if (err) {
                res.sendStatus(403)
            } else {
                getDB(req).models.account.get(result.id, (err, result2) => {
                    customer.balance = 0
                    if (err) {
                        res.sendStatus(401)
                    } else {
                        customer.balance = result2.amount
                    }
                    getDB(req).models.loan.find({ customer_id: result.id }, (err, result3) => {
                        customer.dept = 0
                        if (err) {
                            res.sendStatus(401)
                        } else {
                            result3.forEach(e => {
                                customer.dept += e.amount
                            })
                        }
                        res.render('Customer/CustomerView', {
                            firstname: result.fname, surname: result.lname, date: formatDate(result.DOB), gender: result.gender,
                            phone: result.phone, id: result.ssn, homeaddress: result.homeaddress, workaddress: result.workaddress, blance: customer.balance, deptblance: customer.dept
                        })
                    
                    })
                })
            }
        })
    }
})

app.get("/customer/transaction", (req, res) => {
    if (checkUser(req.session, res, 'customer')) {
        var transactions = []
        var count = 0
        getDB(req).models.transaction.find({ customer_id: req.session.user.customer_id }, (err, result) => {
            if (err) {
                res.render('Customer/transaction', { transactions })
            } else {
                count = result.length
                if (count === 0) {
                    res.render('Customer/transaction', { transactions })
                } else {
                    result.forEach(e => {
                        var transaction = {
                            amount: changeBalance(e.amount),
                            date: formatDate(e.date) + ' ' + formatTime(e.date),
                            type: typeTransaction(e.amount)
                        }
                        transactions.push(transaction)
                        if (count === transactions.length) {
                            res.render('Customer/transaction', { transactions })
                        }
                    })
                }
            }
        })
    }
})

app.get("/customer/ask", (req, res) => {
    if (checkUser(req.session, res, 'customer')) {
        res.render('Customer/Ask')
    }
})

app.use(function (req, res) {
    res.sendStatus(404);
});

app.listen(port, () => console.log(`261342 Project app listening on port ${port}!`))

function checkUser(session, res, page) {
    if (session.user === undefined) {
        redirect(session.user, res)
        return false
    } else {
        switch (page) {
            case 'admin':
                if (!session.user.admin) {
                    redirect(session.user, res)
                    return false
                }
                break;
            case 'crm':
                if (!session.user.officer_id) {
                    redirect(session.user, res)
                    return false
                } else {
                    if (!session.user.name) {
                        res.redirect('/editOfficer')
                        return false
                    } else {
                        if (session.user.position) {
                            redirect(session.user, res)
                            return false
                        }
                    }
                }
                break;
            case 'debt':
                if (!session.user.officer_id) {
                    redirect(session.user, res)
                    return false
                } else {
                    if (!session.user.name) {
                        res.redirect('/editOfficer')
                        return false
                    } else {
                        if (!session.user.position) {
                            redirect(session.user, res)
                            return false
                        }
                    }
                }
                break;
            case 'customer':
                if (!session.user.customer_id) {
                    redirect(session.user, res)
                    return false
                }
                break;
        }
    }

    return true;
}

function redirect(user, res) {
    if (user) {
        if (user.customer_id) {
            res.redirect('/customer')
        } else {
            if (user.position) {
                res.redirect('/debt')
            } else {
                res.redirect('/crm')
            }
        }
    } else {
        res.redirect('/')
    }
}

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
function typeTransaction(number) {
    if (number > 0) {
        return 'Deposit'
    } else {
        return 'Widthdraw'
    }
}
function changeBalance(number) {
    if (number > 0) {
        return number
    } else {
        return -number
    }
}

function createDB(req) {
    const cookies = req.headers.cookie.split(';')
    for(var c of cookies) {
        const cookie = c.split('=')
        if (cookie[0] === 'connect.sid') {
            Database[cookie[1]] = connectDB()
            setTimeout(() => delete Database[cookie[1]], 600000);
            break;
        }
    }
}

function getDB(req) {
    const cookies = req.headers.cookie.split(';')
    for(var c of cookies) {
        const cookie = c.split('=')
        if (cookie[0] === 'connect.sid') {
            return Database[cookie[1]]
        }
    }
}

function connectDB() {
    var connect = orm.connect("mysql://root:@localhost/group6");

    connect.define('crms', {
        id: {type: 'number', key: true},
        fname: String,
        lname: String,
        DOB: Date,
        gender: Boolean,
        ssn: String
    }, {
        methods: {
            fullname: function() {
                return this.fname + ' ' + this.lname
            }
        }
    })

    connect.define('debts', {
        id: {type: 'number', key: true},
        fname: String,
        lname: String,
        DOB: Date,
        gender: Boolean,
        ssn: String
    }, {
        methods: {
            fullname: function() {
                return this.fname + ' ' + this.lname
            }
        }
    })

    connect.define('officers', {
        id: {type: 'number', key: true},
        fname: String,
        lname: String,
        DOB: Date,
        gender: Boolean,
        ssn: String
    }, {
        methods: {
            fullname: function() {
                return this.fname + ' ' + this.lname
            }
        }
    })

    connect.define('customers', {
        id: {type: 'number', key: true},
        fname: String,
        lname: String,
        workaddress: String,
        DOB: Date,
        homeaddress: String,
        phone: String,
        gender: Boolean,
        ssn: String
    }, {
        methods: {
            fullname: function() {
                return this.fname + ' ' + this.lname
            } 
        }
    })

    connect.define('calendar', {
        weekday: Number,
        officer_id: Number,
        id: {type: 'number', key: true}
    })

    connect.define('request_list', {
        campaign: String,
        amount: Number,
        asset: String,
        customer_id: {type: 'number', key: true}
    })

    connect.define('account', {
        amount: Number,
        customer_id: {type: 'number', key: true}
    })

    connect.define('transaction', {
        amount: Number,
        date: Date,
        customer_id: Number,
        id: {type: 'number', key: true}
    })

    connect.define('loan', {
        id: {type: 'number', key: true},
        amount: Number,
        interest_rate: Number,
        time: Date,
        asset: String,
        payback: Number,
        customer_id: Number
    })

    connect.define('tracking', {
        priority: Number,
        loan_id: {type: 'number', key: true},
        debt_id: Number
    })

    connect.define('login', {
        username: {type: 'text', key: true},
        password: String,
        admin: Boolean,
        position: Boolean,
        officer_id: Number,
        customer_id: Number
    })

    var transaction = {
        status: false,
        begin: function (cb) {
            connect.driver.execQuery("BEGIN", function (err) {
                cb(err)
            })
        },
        commit: function (cb) {
            connect.driver.execQuery("COMMIT", function (err) {
                cb(err)
            })
        },
        rollback: function (cb) {
            connect.driver.execQuery("ROLLBACK", function (err) {
                cb(err)
            })
        }
    }

    return { models: connect.models, transaction }
}