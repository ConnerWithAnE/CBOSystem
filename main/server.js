'use strict'

const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://toor:root@mongodbdatabase:27017'

const app = express();
const bodyParser = require("body-parser");
const e = require('express');
const { resolve } = require('path/posix');

//const client = new MongoClient(url);

app.use(bodyParser.urlencoded({
    extended: true
}));

let con
MongoClient.connect(url, (err, db) => {
    con = db.db("mongodbdatabase");
})

const PORT = 8080;
const HOST = '0.0.0.0';

app.use('/', express.static('public'));

app.get('/createDatabase', (req, res) => {

        // Creating the main collection
        con.createCollection("CBOdb", function(err, result) {
            if (err) throw err;
            console.log("Collection Created");
        })
        // Adding an account 'admin' for login purposes. UserID: 0000; Password: admin;
        let adminobj = {staff: true, position: 'admin', name: 'admin', id: '0000', password: 'admin'};
        con.collection("CBOdb").insertOne(adminobj, function(err, result) {
            if (err) throw err;
            console.log(result);
            console.log("Admin created");
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

    let mongoQuery = {id: staffID};

    //let sqlQuery = `SELECT name, password FROM CBOdb WHERE id = '${staffID}'`

    // Promise to resolve query
    
    let query = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })
    });
    query.then((result) => {
        console.log(result);
        // Looping through each value in the results, checking that the password is correct
        Object.keys(result).forEach(function(key) {
        // If query for ID is successfull, compare passwords
        console.log(result[key]);
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

        let mongoQuery = {staff: true, position: staffPosition, name: staffName, id: staffID, password: staffPassword};
        let idQuery = {id: staffID};

        // Query to grab ID to see if it is taken
        let idCheck = new Promise((resolve, reject) => {
            con.collection("CBOdb").find(idQuery).toArray((err, result) => {
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
                // If the ID in the query matches the given, return error, it is in use
                if (staffID == result[key].id) {
                    res.send(JSON.stringify({code:4}));
                    idTaken = true;
                }
            })
            // If the id is not taken, perform an insert of the new user
            if (idTaken == false) {  
                let query = new Promise((resolve, reject) => {
                    con.collection("CBOdb").insertOne(mongoQuery, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                query.then((result) => {
                    // Verify that the user has been added to the table
                    let verifyQuery = new Promise((resolve, reject) => {
                        con.collection("CBOdb").find(idQuery).toArray((err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        })
                    })
                    // Send verification if successfull
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
    let mongoQuery;


    let idExists = true;

    mongoQuery = {id:staffToDel};
   
    // Query to check if the staff member exists in the database
    let ifExistsQuery = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    ifExistsQuery.then((result) => {
        Object.keys(result).forEach(function(key) {
            // If query for ID is successfull, check to ensure they are the same
            if (staffToDel != result[key].id) {
                idExists = false;
                res.send(JSON.stringify({code:2}));
            // Ensure that it is also a staff ID
            } else if (result[key].staff == 0) {
                idExists = false;
                res.send(JSON.stringify({code:4}));
            }
        }) 
    })
    ifExistsQuery.catch((error) => {
        res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
    })

    // Query to delete staff member from the database if the id exists
    if (idExists == true) {
        let query = new Promise((resolve, reject) => {
            con.collection("CBOdb").deleteOne(mongoQuery, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        query.then((result) => {
            // Verfiy the deleteion was successful 
            let verifyQuery = new Promise((resolve, reject) => {
                con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
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

app.post('/updateStaff', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified enter
        [*]  1 = Error Occured, contact admin
        [*]  2 = Passwords do not match, try again
        [*]  3 = Register passed but not verified
        [*]  4 = ID does not exist or is customer
        */

    // Saving values as objects
    let staffPosition = {val: req.body.job, title: 'position'};
    let staffName = {val: req.body.sName, title: 'name'};
    let staffID = {val: req.body.staffID, title: 'id'};
    let staffAddress = {val: req.body.address, title: 'address'};
    let staffPhone = {val: req.body.phone, title: 'phone'};
    let staffPassword = {val: req.body.password, title: 'password'}
    let staffPasswordV = req.body.passwordV;

    // Initializing the query

    let mongoQuery = `{`;
    
    let idExists = true;

    // Ensuring passwords match if they are to be updated
    if (staffPassword.val != "") {
        if (staffPassword.val != staffPasswordV) {
            res.send(JSON.stringify({code:2}));
            return;
        }
    }

    let valList = [staffPosition, staffName, staffPassword, staffAddress, staffPhone];
    let toUpdate = [];

    // Finding non-empty values which are intended to be updated
    valList.forEach(element => {
        console.log(element);
        console.log(toUpdate);
        if (element.val != "") {
            toUpdate.push(element);
        }
    })
    // Saving the updated values to the query 
    toUpdate.forEach(element => {
        if (toUpdate.indexOf(element) == toUpdate.length-1){
            mongoQuery += `"${element.title}":"${element.val}"}`
        } else {
            mongoQuery += `"${element.title}":"${element.val}", `
        }
    })
    // Ensuring the query is not going to be empty
    if (toUpdate.length == 0) {
        res.send(JSON.stringify({code:5})) // Must enter values to update
        return
    }
    mongoQuery = { $set: JSON.parse(mongoQuery)};
    let idQuery = {id:staffID.val};

    // Checking the ID belongs to staff
    let idCheck = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(idQuery).toArray((err, result) => {
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
            // If query for ID is successfull, check if it is staff
            if (staffID.val != result[key].id) {
                res.send(JSON.stringify({code:4}));
                idExists = false;
            } else if (result[key].staff == 0) {
                res.send(JSON.stringify({code:4}));
                idExists = false;
            }
        })
        if (idExists == true) {  
            // If the ID is staff, update the database
            let query = new Promise((resolve, reject) => {
                con.collection("CBOdb").updateOne(idQuery, mongoQuery, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            query.then((result) => {
                res.send(JSON.stringify({code:0})); // Successfull update
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
});

app.post('/getStaffData', (req, res) => {

    /*
        ~Responses~
        [*]  result = Data retrieved and sent
        [*]  1 = Error Occured, contact admin
        [*]  2 = ID does not exist or does not belong to Patient
    */

        let staffID = req.body.staffID;
        let idExists = true;
    
        let responseText;
           
        let mongoQuery = {id:staffID};
        
        // Check to make sure the ID is a staff ID
        let idCheck = new Promise((resolve, reject) => {
            con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(result);
                    resolve(result);
                }
            })
        })
        idCheck.then((result) => {
            // Check if the ID is empty
            if (result.length == 0) {
                idExists = false;
                res.send(JSON.stringify({code:2}))
                return
            }
            // Make sure the ID does have the staff tag
            Object.keys(result).forEach(function(key) {
                if (result[key].staff == 0) {
                    idExists = false;
                    res.send(JSON.stringify({code:2}));
                    return
                }
            })
            if (idExists == true) {
                // call query to get data
                let query = new Promise((resolve, reject) => {
                    con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                // Setup data to be displayed on front end
                query.then((result) => {
                    console.log(result[0]);
                    Object.keys(result[0]).forEach(function(key) {
                            if ((result[0])[key] == null) {
                                responseText += `|Empty`;
                            } else {
                            responseText += `|${(result[0])[key]}`;
                            }
                    })
                    res.send(JSON.stringify({val: responseText}));
                })
                query.catch((error) => {
                    res.send(JSON.stringify({code:1}));
                });
            }
        });
        idCheck.catch((error) => {
            res.send(JSON.stringify({code:1}));
        });

});

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

    let mongoQuery;

    let idTaken = false;

    // Checking if new password entered 
    if (customerPassword != customerPasswordV) {
        res.send(JSON.stringify({code:2})) //"Passwords do not match, customer not registered");
    } else {
        if (customerAddress == '' && customerPhone == '') {
            mongoQuery = {staff: false, name: customerName, id: customerID, password: customerPassword, address: "Empty", phone: "Empty"};
        } else if (customerAddress == '') {
            mongoQuery = {staff: false, name: customerName, id: customerID, password: customerPassword, address: "Empty", phone: customerPhone};
        } else if (customerPhone == '') {
            mongoQuery = {staff:false, name: customerName, id: customerID, password: customerPassword, address: customerAddress, phone: "Empty"};
        } else {
            mongoQuery = {staff:false, name: customerName, id: customerID, password: customerPassword, address: customerAddress, phone: customerPhone};
        }
        
        
        let idQuery = {id: customerID};
       
        // Query to grab ID to see if it is taken
        let idCheck = new Promise((resolve, reject) => {
            con.collection("CBOdb").find(idQuery).toArray((err, result) => {
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
                // If the ID in the query matches the given, return error, it is in use
                if (customerID == result[key].id) {
                    res.send(JSON.stringify({code:4}));
                    idTaken = true;
                }
            })
            // If the id is not taken, perform an insert of the new user
            if (idTaken == false) {  
                let query = new Promise((resolve, reject) => {
                    con.collection("CBOdb").insertOne(mongoQuery, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                query.then((result) => {
                    // Create table with ID of customer to store personal reports
                    
                    con.createCollection(`t${customerID}`, (err, result) => {
                        if (err) throw err;
                        else console.log("Customer Table Created");
                    })

                    // Verify that the user has been added to the table
                    let verifyQuery = new Promise((resolve, reject) => {
                        con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
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
    let mongoQuery;

    let idExists = true;


    mongoQuery = {id:customerToDel};
    


    // Query to see if the customer exists 
    let ifExistsQuery = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
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
            con.collection("CBOdb").deleteOne(mongoQuery, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        query.then((result) => {
            // Remove custome table
            con.collection(`t${customerToDel}`).drop((err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log(`Collection with ID: ${customerToDel} Deleted`);
                }
            })
            // Verify deletion of customer
            let verifyQuery = new Promise((resolve, reject) => {
                con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
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

app.post('/updateCustomer', (req, res) => {

    /*
        ~Responses~
        [*]  0 = Successful and verified enter
        [*]  1 = Error Occured, contact admin
        [*]  2 = Passwords do not match, try again
        [*]  3 = Register passed but not verified
        [*]  4 = ID does not exist or is staff
        [*]  5 = Values to update is empty
    */

    // Getting data from request
    let customerName = {val: req.body.cName, title: 'name'};
    let customerID = {val: req.body.cID, title: 'id'};
    let customerPassword = {val: req.body.password, title: 'password'};
    let customerPasswordV = req.body.passwordV;

    let customerAddress = {val: req.body.address, title: 'address'};
    let customerPhone = {val: req.body.phone, title: 'phone'};



    let mongoQuery = `{`;

    let idExists = true;

   // Ensuring passwords match if they are to be updated
    if (customerPassword.val != "") {
        if (customerPassword.val != customerPasswordV) {
            res.send(JSON.stringify({code:2}));
            return;
        }
    }

    let valList = [customerName, customerPassword, customerAddress, customerPhone];
    let toUpdate = [];

    // Finding non-empty values which are intended to be updated
    valList.forEach(element => {
        console.log(element);
        console.log(toUpdate);
        if (element.val != "") {
            toUpdate.push(element);
        }
    })
    // Saving the updated values to the query 
    toUpdate.forEach(element => {
        if (toUpdate.indexOf(element) == toUpdate.length-1){
            mongoQuery += `"${element.title}":"${element.val}"}`
        } else {
            mongoQuery += `"${element.title}":"${element.val}", `
        }
    })
    // Ensuring the query is not going to be empty
    if (toUpdate.length == 0) {
        res.send(JSON.stringify({code:5})) // Must enter values to update
        return
    }
    mongoQuery = { $set: JSON.parse(mongoQuery)};
    let idQuery = {id:staffID.val};

    // Checking the ID belongs to a customer
    let idCheck = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(idQuery).toArray((err, result) => {
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
            // If query for ID is successfull, check if it is customer
            if (customerID.val != result[key].id) {
                res.send(JSON.stringify({code:4}));
                idExists = false;
            } else if (result[key].staff == 0) {
                res.send(JSON.stringify({code:4}));
                idExists = false;
            }
        })
        if (idExists == true) {  
            // If the ID is a customer, update the database
            let query = new Promise((resolve, reject) => {
                con.collection("CBOdb").updateOne(idQuery, mongoQuery, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(result);
                        resolve(result);
                    }
                });
            });

            query.then((result) => {
                res.send(JSON.stringify({code:0})); // Successfull update
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
});

app.post('/createCustomerReport', (req, res) => {

    // Save request data
    let customerID = req.body.cID;
    let currentDateTime = req.body.currentDT.replace('T', ' ');
    let customerBirthday = req.body.cBday;

    let consNum;
    let isStaff = true;

    let staffID = req.body.staffID;
    let summary = req.body.summary;
    let priorIssues = req.body.issues;
    let treatment = req.body.treatment;

    let check = [customerID, currentDateTime, customerBirthday, staffID, summary, priorIssues, treatment];

    let mongoQuery;
    let mongoCheck = {id:staffID};


    // Ensure no elements are empty
    check.forEach(element => {
        if (element == '') {
            res.send(JSON.stringify({code:2}))
            isStaff = false;
            return
        }
    })

    // Ensure the given staff member exists
    let ifExistsQuery = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(mongoCheck).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log(result);
                resolve(result);
            }
        });
    });
    ifExistsQuery.then((result) => {
        // See if the result is empty
        if (result.length == 0) {
            isStaff = false;
            res.send(JSON.stringify({code:3}));
            return;
        }
        Object.keys(result).forEach(function(key) {
            console.log(result);
            // Ensure the ID is a staff is
            if (result[key].staff == 0) {
                isStaff = false;
                res.send(JSON.stringify({code:3}));
                return;
            }
        }) 
        if (isStaff == true) {
            // If it is a staff ID, query the customer report database to get length
            let rowQuery = new Promise((resolve, reject) => {
                con.collection(`t${customerID}`).count((err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(result);
                        resolve(result);
                    }
                });
            })
            rowQuery.then((result) => {
                // Save length and update the query
                consNum = result + 1;
                consNum = consNum.toString();
                mongoQuery = {entrynum: consNum, time: currentDateTime, dateofbirth: customerBirthday, staffid: staffID, summary: summary, problems: priorIssues, treatment: treatment};
                // Add the data to a new consultation report
                let reportQuery = new Promise((resolve, reject) => {
                    con.collection(`t${customerID}`).insertOne(mongoQuery, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    })
                })
                reportQuery.then((result) => {
                    res.send(JSON.stringify({code:0}));
                });
                reportQuery.catch((error) => {
                    res.send(JSON.stringify({code:1}));
                })
            })
            rowQuery.catch((error) => {
                res.send(JSON.stringify({code:1}));
            })
        }
    })
    ifExistsQuery.catch((error) => {
        res.send(JSON.stringify({code:1})); //"**Error ecounterd, staff not registerd**\nPlease contact system Administrator.")
    })


    
    //let customerReportTable;

    

})
 
app.get('/getAllCustomers', (req, res) => {

    // Select all customers from the database
    let mongoQuery = {staff:false};

    let responseText;

    // Query to get all customers in the database
    let query = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(mongoQuery).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result)
            }
        })
    });
    query.then((result) => {
        // Setting up the data to be recieved as cards on the front end
        Object.keys(result).forEach(function(key) {
            let row = result[key];

            responseText += `\n${row.name}|${row.id}`;
        })

        res.send(JSON.stringify({val: responseText}));
    })
    query.catch((error) => {
        res.send(JSON.stringify({code:1}));
    })

})

app.post('/getCustomerData', (req, res) => {

     /*
        ~Responses~
        [*]  result = Data retrieved and sent
        [*]  1 = Error Occured, contact admin
        [*]  2 = ID does not exist or does not belong to Patient
    */

    let customerID = req.body.cID;
    let idExists = true;

    let responseText = {data:null, reports:null};
       
    let mongoDataQuery = {id:customerID};

    let idQuery = {id:customerID};
    
    // Ensure id is in use and not a staff ID
    let idCheck = new Promise((resolve, reject) => {
        con.collection("CBOdb").find(idQuery).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log(result);
                resolve(result);
            }
        })
    })
    idCheck.then((result) => {
        if (result.length == 0) {
            idExists = false;
            res.send(JSON.stringify({code:2}))
            return
        }
        Object.keys(result).forEach(function(key) {
            if (result[key].staff == 1) {
                idExists = false;
                res.send(JSON.stringify({code:2}));
                return
            }
        })
        if (idExists == true) {
            // if the ID exists and is customer 
            let query = new Promise((resolve, reject) => {
                con.collection("CBOdb").find(mongoDataQuery).toArray((err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            query.then((result) => {
                // Get the customers personal info and format it for the front end
                Object.keys(result[0]).forEach(function(key) {
                        if ((result[0])[key] == null) {
                            responseText.data += `|Empty`;
                        } else {
                        responseText.data += `|${(result[0])[key]}`;
                        }
                })
                let reportQuery = new Promise((resolve, reject) => {
                    con.collection(`t${customerID}`).find().toArray((err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        };
                    });
                });
                // Getting all the data from each report for the customer and formatting it for the front end
                reportQuery.then((result) => {
                    console.log(result);
                    Object.keys(result).forEach(function(key) {
                        let reportRes;
                        
                        Object.keys(result[key]).forEach(function(k) {

                            reportRes += `|${result[key][k]}`;
                        })
                        responseText.reports += `\n${reportRes}`;
                    })

                    res.send(JSON.stringify({val: responseText}));
                })
            })
            query.catch((error) => {
                res.send(JSON.stringify({code:1}));
            });
        }
    });
    idCheck.catch((error) => {
        res.send(JSON.stringify({code:1}));
    });
});              

console.log("\n**********************");
console.log("*                    *\n*   Server Running   *\n*                    *");
console.log("**********************\n");

app.listen(PORT, HOST);