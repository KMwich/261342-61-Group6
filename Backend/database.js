const orm = require("orm");

// module.exports = orm.connect("mysql://root:@localhost/group6", (err, db) => {
//     if (err) throw err;

//     this.crms = db.define('crms', {
//         id: Number,
//         fname: String,
//         lname: String,
//         gender: Number
//     })

//     this.debts = db.define('debts', {
//         id: Number,
//         fname: String,
//         lname: String,
//         gender: Number
//     })

//     this.officers = db.define('officers', {
//         id: Number,
//         fname: String,
//         lname: String,
//         gender: Number
//     }, {
//         methods: {
//             fullname: () => {
//                 console.log(this)
//                 return this.name + ' ' + this.surname;
//             }
//         }
//     })

//     this.customers = db.define('customers', {
//         id: Number,
//         fname: String,
//         lname: String,
//         workaddress: String,
//         DOB: Date,
//         homeaddress: String,
//         phone: String,
//         gender: Number
//     }, {
//         methods: {
//             fullname: () => {
//                 return this.fname + this.lname
//             }
//         }
//     })

//     this.calender = db.define('calendar', {
//         weekday: Number,
//         officer_id: Number
//     })

//     this.request_list = db.define('request_list', {
//         campaign: String,
//         amount: Number,
//         asset: String,
//         customer_id: Number
//     })

//     this.account = db.define('account', {
//         amount: Number,
//         customer_id: Number
//     })

//     this.transaction = db.define('transaction', {
//         amount: Number,
//         data: String,
//         customer_id: Number
//     })

//     this.loan = db.define('loan', {
//         id: Number,
//         amount: Number,
//         interest_rate: Number,
//         time: Date,
//         asset: String,
//         payback: Number,
//         customer_id: Number
//     })

//     this.tracking= db.define('tracking', {
//         priority: Number,
//         loan_id: Number,
//         debt_id: Number
//     })

//     this.login = db.define('login', {
//         username: {type: 'text', key: true},
//         password: String,
//         admin: Number,
//         position: Number,
//         officer_id: Number,
//         customer_id: Number
//     })
// })

class Database {
    constructor(callback) {
        orm.connect("mysql://root:@localhost/group6", (err, db) => {
            if (err) throw err;

            this.officers = db.define('officers', {
                id: Number,
                fname: String,
                lname: String,
                gender: Number
            }, {
                methods: {
                    fullname: () => {
                        return this.name + ' ' + this.surname;
                    }
                }
            })

            this.customers = db.define('customers', {
                id: Number,
                fname: String,
                lname: String,
                workaddress: String,
                DOB: Date,
                homeaddress: String,
                phone: String,
                gender: Number
            }, {
                methods: {
                    fullname: () => {
                        return this.fname + this.lname
                    }
                }
            })

            this.crms = db.define('crms', {
                id: Number,
                fname: String,
                lname: String,
                gender: Number
            })

            this.debts = db.define('debts', {
                id: Number,
                fname: String,
                lname: String,
                gender: Number
            })

            this.calender = db.define('calendar', {
                weekday: Number,
                officer_id: Number
            })

            this.request_list = db.define('request_list', {
                campaign: String,
                amount: Number,
                asset: String,
                customer_id: Number
            })

            this.account = db.define('account', {
                amount: Number,
                customer_id: Number
            })

            this.transaction = db.define('transaction', {
                amount: Number,
                date: Date,
                customer_id: Number
            })

            this.loan = db.define('loan', {
                id: Number,
                amount: Number,
                interest_rate: Number,
                time: Date,
                asset: String,
                payback: Number,
                customer_id: Number
            })

            this.tracking= db.define('tracking', {
                priority: Number,
                loan_id: Number,
                debt_id: Number
            })

            this.login = db.define('login', {
                username: {type: 'text', key: true},
                password: String,
                admin: Number,
                position: Number,
                officer_id: Number,
                customer_id: Number
            })

            callback()
        });
    }
}

module.exports = Database