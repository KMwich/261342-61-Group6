const models = {
    define: (db, models) => {
        models.crms = db.define('crms', {
            id: {type: 'number', key: true},
            fname: String,
            lname: String,
            gender: Boolean,
            ssn: String
        })

        models.debts = db.define('debts', {
            id: {type: 'number', key: true},
            fname: String,
            lname: String,
            gender: Boolean,
            ssn: String
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
            },
            hook: {
                beforeCreate: function () {
                    return new Promise(function(resolve, reject) {
                        models.customers.get(this.id, (err, result) => {
                            if (err) {
                                resolve();
                            }else{
                                reject("Already has this officer");
                            }
                        })
                    })
                },
                beforeSave: function () {
                    return new Promise(function(resolve, reject) {
                        models.customers.get(this.id, (err, result) => {
                            if (err) {
                                reject("Don't has this officer");
                            }else{
                                resolve();
                            }
                        })
                    })
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
            },
            hook: {
                beforeCreate: function () {
                    return new Promise(function(resolve, reject) {
                        models.customers.get(this.id, (err, result) => {
                            if (err) {
                                resolve();
                            }else{
                                reject("Already has this customer");
                            }
                        })
                    })
                },
                beforeSave: function () {
                    return new Promise(function(resolve, reject) {
                        models.customers.get(this.id, (err, result) => {
                            if (err) {
                                reject("Don't has this customer");
                            }else{
                                resolve();
                            }
                        })
                    })
                }  
            },
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
        }, {
            hook: {
                beforeCreate: function () {
                    return new Promise(function(resolve, reject) {
                        models.loan.get(this.id, (err, result) => {
                            if (err) {
                                reject("Don't has this loan");
                            }else{
                                resolve();
                            }
                        })
                    })
                },
                beforeSave: function () {
                    return new Promise(function(resolve, reject) {
                        models.loan.get(this.id, (err, result) => {
                            if (err) {
                                reject("Don't has this loan");
                            }else{
                                resolve();
                            }
                        })
                    })
                }
            }
        })

        models.tracking= db.define('tracking', {
            priority: Number,
            loan_id: Number,
            debt_id: {type: 'number', key: true}
        })

        models.login = db.define('login', {
            username: {type: 'text', key: true},
            password: String,
            admin: Boolean,
            position: Boolean,
            officer_id: Number,
            customer_id: Number
        }, {
            hook: {
                beforeCreate: function () {
                    return new Promise(function(resolve, reject) {
                        models.login.get(this.username, (err, res) => {
                            if (err) {
                                if (officer_id) {
                                    models.officers.get(this.officer_id, (err, res) => {
                                        if (err) {
                                            resolve();
                                        }else{
                                            reject("Don't has this officer")
                                        }
                                    })
                                }else{ 
                                    models.customers.get(this.customer_id, (err, res) => {
                                        if (err) {
                                            resolve();
                                        }else {
                                            reject("Don't has this customer")
                                        }
                                    })
                                }
                            }else{
                                reject("Already has this username");
                            }
                        })
                    })
                }   
            }
        })
    }
};

module.exports = { models } 