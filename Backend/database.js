const orm = require("orm");

class Database {
    constructor(callback) {
        orm.connect("mysql://root:@localhost/group6", (err, db) => {
            if (err) throw err;

            this.crms = db.define('crms', {
                id: Number,
                fname: String,
                lname: String,
                gender: Number
            })
        });
        callback()
    }
}

module.exports = Database