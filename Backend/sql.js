const mysql = require("mysql")

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

export class db {
    select = (table) => {

    }

    insert = (table) => {

    }

    delete = (table) => {

    }

    update = (table) => {
        
    }
}