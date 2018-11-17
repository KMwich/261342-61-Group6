const models = {
    define: (db, models) => {
        models.crms = db.define('crms', {
            id: {type: 'number', key: true},
            fname: String,
            lname: String,
            gender: Boolean,
            ssn: String
        }, {
            methods: {
                fullname: function() {
                    return this.fname + ' ' + this.lname
                }
            }
        })

        models.debts = db.define('debts', {
            id: {type: 'number', key: true},
            fname: String,
            lname: String,
            gender: Boolean,
            ssn: String
        }, {
            methods: {
                fullname: function() {
                    return this.fname + ' ' + this.lname
                }
            }
        })

        models.officers = db.define('officers', {
            id: {type: 'number', key: true},
            fname: String,
            lname: String,
            gender: Boolean,
            ssn: String
        }, {
            methods: {
                fullname: function() {
                    return this.fname + ' ' + this.lname
                }
            }
        })

        models.customers = db.define('customers', {
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

        models.calendar = db.define('calendar', {
            weekday: Number,
            officer_id: Number,
            id: {type: 'number', key: true}
        })

        models.request_list = db.define('request_list', {
            campaign: String,
            amount: Number,
            asset: String,
            customer_id: {type: 'number', key: true}
        })

        models.account = db.define('account', {
            amount: Number,
            customer_id: {type: 'number', key: true}
        })

        models.transaction = db.define('transaction', {
            amount: Number,
            date: Date,
            customer_id: Number,
            id: {type: 'number', key: true}
        })

        models.loan = db.define('loan', {
            id: {type: 'number', key: true},
            amount: Number,
            interest_rate: Number,
            time: Date,
            asset: String,
            payback: Number,
            customer_id: Number
        })

        models.tracking= db.define('tracking', {
            priority: Number,
            loan_id: {type: 'number', key: true},
            debt_id: Number
        })

        models.login = db.define('login', {
            username: {type: 'text', key: true},
            password: String,
            admin: Boolean,
            position: Boolean,
            officer_id: Number,
            customer_id: Number
        })
    }
};

module.exports = { models } 