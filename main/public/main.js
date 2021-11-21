
let signedIn = false;
let signedInUser;
let signedInUserId;
let staff = false;

function staffSignIn() {

    let http = new XMLHttpRequest();
    let url = '/staffSignIn';

    let params = `staffID=${document.getElementById('staffIDInput').value}&password=${document.getElementById('staffPassword').value}`;

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            let response = JSON.parse(http.responseText);

            if (response.code == 2) {
                alert("Invalid Login\nPlease Try Again");
            } else {
                signedInUser = response.name;
                signedInUserId = response.id;
                signedIn = true;
                staff = true;
                window.location.href = "/staffPanel.html";
            }
        };
    };
    http.send(params);
};

function registerStaffMember() {

    /*
    if (staff == false) {
        alert("Not signed in as staff");
    } else {}
    */

    let http = new XMLHttpRequest();
    let url = '/registerStaff';

    let staffPosition = document.getElementById('staffPosInput').value;
    let staffName = document.getElementById('staffNameInput').value;
    let staffID = document.getElementById('staffIDInput').value;
    let staffPassword = document.getElementById('staffPassword').value;
    let staffPasswordV = document.getElementById('staffPasswordV').value;

    let params = `job=${staffPosition}&sName=${staffName}&staffID=${staffID}&password=${staffPassword}&passwordV=${staffPasswordV}`;

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            
            let response = JSON.parse(http.responseText);

            console.log(response.code);

            if (response.code == 2) {
                alert("Passwords do not match\nPlease try again")
            } else if (response.code == 4) {
                alert("ID already in Database");
            } else if (response.code == 3) {
                alert("Register Passed but not confirmed");
            } else if (response.code == 1) {
                alert("Error encountered, please contact administrator.");
            } else {
                alert("Staff Registration Successful!");
                window.location.href = '/staffPanel.html'
            };
        };
    };
    http.send(params);
};

function removeStaffMember() {

    /*
    if (staff == false) {
        alert("Not signed in as staff");
    } else {}
    */

    let http = new XMLHttpRequest();
    let url = '/removeStaff';

    let staffID = document.getElementById('staffIDInput').value;
   
    let params = `staffID=${staffID}`;

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            
            let response = JSON.parse(http.responseText);

            console.log(response.code);

            if (response.code == 2) {
                alert("No staff member found with given ID")
            } else if (response.code == 4) {
                alert("Entered ID belongs to Patient");
            } else if (response.code == 3) {
                alert("Delete Passed but not confirmed");
            } else if (response.code == 1) {
                alert("Error encountered, please contact administrator.");
            } else {
                alert("Staff Removal Successful!");
                window.location.href = '/staffPanel.html'
            };
        };
    };
    http.send(params);
};

function registerCustomer() {

    /*
    if (staff == false) {
        alert("Not signed in as staff");
    } else {}
    */

    let http = new XMLHttpRequest();
    let url = '/registerCustomer';

    let customerName = document.getElementById('customerNameInput').value;
    let customerID = document.getElementById('customerIDInput').value;
    let customerAddress = document.getElementById('customerAddressInput').value;
    let customerPhone = document.getElementById('customerPhoneInput').value;
    let customerPassword = document.getElementById('customerPassword').value;
    let customerPasswordV = document.getElementById('customerPasswordV').value;

    let params = `cName=${customerName}&cID=${customerID}&address=${customerAddress}&phone=${customerPhone}&password=${customerPassword}&passwordV=${customerPasswordV}`;

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            
            let response = JSON.parse(http.responseText);

            console.log(response.code);

            if (response.code == 2) {
                alert("Passwords do not match\nPlease try again")
            } else if (response.code == 4) {
                alert("ID already in Database");
            } else if (response.code == 3) {
                alert("Register Passed but not confirmed");
            } else if (response.code == 1) {
                alert("Error encountered, please contact administrator.");
            } else {
                alert("Patient Registration Successful!");
                window.location.href = '/staffPanel.html'
            };
        };
    };
    http.send(params);
};

function removeCustomer() {

    /*
    if (staff == false) {
        alert("Not signed in as staff");
    } else {}
    */

    let http = new XMLHttpRequest();
    let url = '/removeCustomer';

    let customerID = document.getElementById('customerIDInput').value;
   
    let params = `cID=${customerID}`;

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            
            let response = JSON.parse(http.responseText);

            console.log(response.code);

            if (response.code == 2) {
                alert("No patient found with given ID")
            } else if (response.code == 4) {
                alert("Entered ID belongs to Staff");
            } else if (response.code == 3) {
                alert("Delete Passed but not confirmed");
            } else if (response.code == 1) {
                alert("Error encountered, please contact administrator.");
            } else {
                alert("Patient Removal Successful!");
                window.location.href = '/staffPanel.html'
            };
        };
    };
    http.send(params);
};

function getAllCustomerList() {

    let http = new XMLHttpRequest();
    let url = '/getAllCustomers';

    let params = '';

    http.open('POST', url, true);

    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
            let response = http.responseText;

            if (response.code != null){
                alert("Error encountered, please contact administrator.");
            } else {
                let vals = response.split(/\n/);

                vals.shift();

                if (vals.length > 0) {
                    let values = vals.slice().map(vals => 
                    `<div class="card">
                        <h4>Patient Name: ${vals.split('|')[0]}</h4>
                        <h4>Patient ID: ${vals.split('|')[1]}</h4>
                    </div>
                    `).join('');

                    document.getElementById('customer-list').innerHTML = values;

                };
            };
        }
    };
    http.send(params);
};