'use strict'

const express = require('express');
const mysql = require('mysql');

const app = express();
const bodyParser = require("body-parser");
const e = require('express');
const { resolve } = require('path/posix');

app.use(bodyParser.urlencoded({
    extended: true
}));

var con = mysql.createConnection({
    host: 'mysqldatabase',
    user: 'root',
    database: 'CBOdb',
    password: 'admin'
});

const PORT = 8080;
const HOST = '0.0.0.0';

app.use('/', express.static('public'));

// Create database if it does not already exist.

app.get('/createDatabase', (req, res) => {
    con.query("CREATE TABLE IF NOT EXISTS CBOdb(staff BOOLEAN, name VARCHAR(60), time DATETIME, password VARCHAR(40), position VARCHAR(40), id INT, address VARCHAR(40), phone VARCHAR(20))", function (err, result) {
        if (err) throw err;
        else console.log("Database Made");
    });
    res.send();
});

/*
+-------------+
|STAFF CHANGES|
+-------------+
*/

app.post('/staffSignIn', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful login
        [*]  1 = Error Occured, contact admin
        [*]  2 = Password incorrect, try again
    */
    let staffID = req.body.staffID;
    let staffPassword = req.body.password;

    let sqlQuery = `SELECT name, password FROM CBOdb WHERE id = '${staffID}'`

    // Promise to resolve query
    let query = new Promise((resolve, reject) => {
        con.query(sqlQuery, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    query.then((result) => {
        Object.keys(result).forEach(function(key) {
        // If query for ID is successfull, compare passwords
        if (staffPassword == result[key].password) {
            // Return response code 0 and Users name and id for sign-in loggin
            console.log(`User ${staffID} Logged in Successfully`);
            res.send(JSON.stringify({code:0, name: result[key].name, id: staffID}));
        } else {
            // Return response code 2
            res.send(JSON.stringify({code:2}));
        }
        })
    });
    query.catch((err) => {
        res.send(JSON.stringify({code:1}));
    });

})


app.post('/registerStaff', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified enter
        [*]  1 = Error Occured, contact admin
        [*]  2 = Passwords do not match, try again
        [*]  3 = Register passed but not verified
        [*]  4 = ID already in use
    */

    // Getting data from request
    let staffPosition = req.body.job
    let staffName = req.body.sName;
    let staffID = req.body.staffID;
    let staffPassword = req.body.password;
    let staffPasswordV = req.body.passwordV;

    let idTaken = false;

    // Checking if new password entered 
    if (staffPassword != staffPasswordV) {
        res.send(JSON.stringify({code:2})) //"Passwords do not match, staff member not registered");
    } else {

        let sqlQuery = `INSERT INTO CBOdb (staff, position, name, id, password, time) VALUES (TRUE, '${staffPosition}', '${staffName}', '${staffID}', '${staffPassword}', NOW())`;
        let idQuery = `SELECT * FROM CBOdb WHERE id = '${staffID}'`;
        let sqlCheck = `SELECT * FROM CBOdb WHERE name = '${staffName}'`;

        let idCheck = new Promise((resolve, reject) => {
            con.query(idQuery, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    console.log(result);
                    resolve(result);
                }
            })
        })
        idCheck.then((result) => {
            Object.keys(result).forEach(function(key) {
                // If query for ID is successfull, compare passwords
                if (staffID == result[key].id) {
                    res.send(JSON.stringify({code:4}));
                    idTaken = true;
                }
            })
            if (idTaken == false) {  
                let query = new Promise((resolve, reject) => {
                    con.query(sqlQuery, function(err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                query.then((result) => {
                    let verifyQuery = new Promise((resolve, reject) => {
                        con.query(sqlCheck, function(err, result) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        })
                    })
                    verifyQuery.then((result) => {
                        console.log(`Staff member ${staffName} was added.`)
                        res.send(JSON.stringify({code:0}));
                    });
                    verifyQuery.catch((error) => {
                        res.send(JSON.stringify({code:3})); //Register passed but not verified
                    })
                });

                query.catch((err) => {
                    res.send(JSON.stringify({code:1})) //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
                })
            }
        }) 
        idCheck.catch((err) => {
            console.log(err);
            res.send(JSON.stringify({code:1}))
        })
    }
});

app.post('/removeStaff', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified delete
        [*]  1 = Error Occured, contact admin
        [*]  2 = Staff member not found prior to delete. Does not exist
        [*]  3 = Delete passed but not verified
        [*]  4 = Given ID belongs to customer
    */

    let staffToDel = req.body.staffID;
    let sqlQuery;
    let sqlCheck;

    let idExists = true;

    sqlCheck = `SELECT * FROM CBOdb WHERE id = '${staffToDel}'`
    sqlQuery = `DELETE FROM CBOdb WHERE id = '${staffToDel}'`;    
   
    // Querty 
    let ifExistsQuery = new Promise((resolve, reject) => {
        con.query(sqlCheck, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    ifExistsQuery.then((result) => {
        Object.keys(result).forEach(function(key) {
            // If query for ID is successfull, compare passwords
            if (staffToDel != result[key].id) {
                idExists = false;
                res.send(JSON.stringify({code:2}));
            } else if (result[key].staff == 0) {
                idExists = false;
                res.send(JSON.stringify({code:4}));
            }
        }) 
    })
    ifExistsQuery.catch((error) => {
        res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
    })

    // Query to delete staff member from the database
    if (idExists == true) {
        let query = new Promise((resolve, reject) => {
            con.query(sqlCheck, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        query.then((result) => {
            let verifyQuery = new Promise((resolve, reject) => {
                con.query(sqlCheck, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
            })
            verifyQuery.then((result) => {
                res.send(JSON.stringify({code:0}));
            });
            verifyQuery.catch((error) => {
                res.send(JSON.stringify({code:3})); //Delete passed but not verified
            })
        });
        query.catch((error) => {
            res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
        })
    }
});


/*
::TODO::
*/
app.post('/updateStaff', (req, res) => {

    let updateBy = req.body.updateBy; // ID or Name

    let staffName = req.body.staffName;
    let staffID = req.body.staffID;
    let staffPassword = req.body.password;


})

/*
+----------------+
|CUSTOMER CHANGES|
+----------------+
*/

app.post('/registerCustomer', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified enter
        [*]  1 = Error Occured, contact admin
        [*]  2 = Passwords do not match, try again
        [*]  3 = Register passed but not verified
        [*]  4 = ID already in use
    */

    // Getting data from request
    let customerName = req.body.cName;
    let customerID = req.body.cID;
    let customerPassword = req.body.password;
    let customerPasswordV = req.body.passwordV;

    let customerAddress = req.body.address;
    let customerPhone = req.body.phone;

    let sqlQuery;
    let idTaken = false;

    // Checking if new password entered 
    if (customerPassword != customerPasswordV) {
        res.send(JSON.stringify({code:2})) //"Passwords do not match, customer not registered");
    } else {
        if (customerAddress == '' && customerPhone == '') {
            sqlQuery = `INSERT INTO CBOdb (staff, name, id, password, time) VALUES (FALSE, '${customerName}', '${customerID}', '${customerPassword}', NOW())`;
        } else if (customerAddress == '') {
            sqlQuery = `INSERT INTO CBOdb (staff, name, id, password, phone, time) VALUES (FALSE, '${customerName}', '${customerID}', '${customerPassword}', '${customerPhone}', NOW())`;
        } else if (customerPhone == '') {
            sqlQuery = `INSERT INTO CBOdb (staff, name, id, password, address, time) VALUES (FALSE, '${customerName}', '${customerID}', '${customerPassword}', '${customerAddress}', NOW())`;
        } else {
            sqlQuery = `INSERT INTO CBOdb (staff, name, id, password, address, phone, time) VALUES (FALSE, '${customerName}', '${customerID}', '${customerPassword}', '${customerAddress}','${customerPhone}', NOW())`;
        }
        
        let idQuery = `SELECT * FROM CBOdb WHERE id = '${customerID}'`;
        let sqlCheck = `SELECT * FROM CBOdb WHERE name = '${customerName}'`;

        let idCheck = new Promise((resolve, reject) => {
            con.query(idQuery, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    console.log(result);
                    resolve(result);
                }
            })
        })
        idCheck.then((result) => {
            Object.keys(result).forEach(function(key) {
                // If query for ID is successfull, compare passwords
                if (customerID == result[key].id) {
                    res.send(JSON.stringify({code:4}));
                    idTaken = true;
                }
            })
            if (idTaken == false) {  
                let query = new Promise((resolve, reject) => {
                    con.query(sqlQuery, function(err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                query.then((result) => {
                    let verifyQuery = new Promise((resolve, reject) => {
                        con.query(sqlCheck, function(err, result) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        })
                    })
                    verifyQuery.then((result) => {
                        res.send(JSON.stringify({code:0}));
                    });
                    verifyQuery.catch((error) => {
                        res.send(JSON.stringify({code:3})); //Register passed but not verified
                    })
                });

                query.catch((err) => {
                    res.send(JSON.stringify({code:1})) //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
                })
            } 
        })
        idCheck.catch((err) => {
            console.log(err);
            res.send(JSON.stringify({code:1}))
        })
    }
});

app.post('/removeCustomer', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified delete
        [*]  1 = Error Occured, contact admin
        [*]  2 = Staff member not found prior to delete. Does not exist
        [*]  3 = Delete passed but not verified
        [*]  4 = Given ID belongs to staff
    */

    let customerToDel = req.body.cID;
    let sqlQuery;
    let sqlCheck;

    let idExists = true;

    sqlCheck = `SELECT * FROM CBOdb WHERE id = '${customerToDel}'`
    sqlQuery = `DELETE FROM CBOdb WHERE id = '${customerToDel}'`;


    // Querty 
    let ifExistsQuery = new Promise((resolve, reject) => {
        con.query(sqlCheck, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    ifExistsQuery.then((result) => {
        Object.keys(result).forEach(function(key) {
            // If query for ID is successfull, compare passwords
            if (customerToDel != result[key].id) {
                idExists = false;
                res.send(JSON.stringify({code:2}));
            } else if (result[key].staff == 1) {
                idExists = false;
                res.send(JSON.stringify({code:4}));
            }
        })  
    })
    ifExistsQuery.catch((error) => {
        res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
    })

    // Query to delete staff member from the database
    if (idExists == true) {
        let query = new Promise((resolve, reject) => {
            con.query(sqlCheck, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        query.then((result) => {
            let verifyQuery = new Promise((resolve, reject) => {
                con.query(sqlCheck, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
            })
            verifyQuery.then((result) => {
                res.send(JSON.stringify({code:0}));
            });
            verifyQuery.catch((error) => {
                res.send(JSON.stringify({code:3})); //Delete passed but not verified
            })
        });
        query.catch((error) => {
            res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
        })
    }
});

app.post('/getAllCustomers', (req, res) => {

    let sqlQuery = `SELECT name, id FROM CBOdb WHERE staff IS FALSE`;

    let responseText;

    let query = new Promise((resolve, reject) => {
        con.query(sqlQuery, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result)
            }
        })
    });
    query.then((result) => {
        Object.keys(result).forEach(function(key) {
            let row = result[key];

            responseText += `\n${row.name}|${row.id}`;
        })

        res.send(responseText);
    })
    query.catch((error) => {
        res.send(JSON.stringify({code:1}));
    })

})

app.post('/customerData', (req, res) => {

    let sqlQuery;
    let customerToGet;
    /*
    ~Types~
        0 = By Name
        1 = By ID
    */
    if (req.body.searchType == 0) {
        customerToGet = req.body.customerID;
        sqlQuery = `SELECT * FROM CBOdb WHERE name = '${customerToGet}'`        
    } else {
        customerToGet = req.body.customerName;
        sqlQuery = `SELECT * FROM CBOdb WHERE id = '${customerToGet}'`
    }

    let query = new Promise((resolve, reject) => {
        con.query(sqlQuery, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    query.then((result) => {
        res.send(result);
    });
    query.catch((error) => {
        res.send(JSON.stringify({code:1}));
    });
});

console.log("\n\n\nServer Running\n\n\n");

app.listen(PORT, HOST);