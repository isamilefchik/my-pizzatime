// var testDatabase = {
//     table: []
// }
//
// testDatabase.table.push({
//     username:"isa",
//     firstName:"Isa",
//     lastName:"Milefchik",
//     address:"1600 Pennsylvania Ave NW, Washington, DC 20500",
//     phoneNumber:"444-444-4444",
//     email:"loser@gmail.com"
// });

// Prereqs ============================================
"use strict";

var pizzapi = require('./node-dominos-pizza-api/dominos-pizza-api'),
    fs = require('fs'),
    rl = require('readline-sync'),
    colors = require('colors');

colors.setTheme({
    affirm: ['green', 'bold'],
    reject: ['red', 'bold'],
    info: ['magenta', 'bold'],
    prompt: ['blue', 'bold', 'italic']
});

var user = {
    username:null,
    firstName:null,
    lastName:null,
    address:null,
    phoneNumber:null,
    email:null
};

var userStore = null;

// Greeting ===========================================
console.log("\n" +
            "P".yellow.bgRed +
            "i".red.bgYellow +
            "z".yellow.bgRed +
            "z".red.bgYellow +
            "a".yellow.bgRed +
            " ".red.bgYellow +
            "T".yellow.bgRed +
            "i".red.bgYellow +
            "m".yellow.bgRed +
            "e".red.bgYellow +
            "!".yellow.bgRed +
            "\n");

// Main Routine =======================================
var args = process.argv;
if (args.length > 2) {
    if (args.length == 3) {
        retrieveUserData();
    } else {
        console.log("Usage: pizzatime [username]");
        process.exit(1);
    }
} else {
    inputUserData();
}

var storeFound = findStore();
storeFound.then(result => {

    userStore = new pizzapi.Store({
        ID:parseInt(result)
    });

    do {
        var menuResponse = rl.question(colors.prompt("Would you like to build your own pizza " +
                                       "or see the quick menu? q/b: ")).toLowerCase();
    } while (!(["q", "b"].includes(menuResponse)));

    return menuHandler(menuResponse);

}, err => {

    console.log(err);
    process.exit(1);

}).then (result => {

    return orderHandler(result);

}, err => {

    console.log(err);
    process.exit(1);

});

// Helper Functions ==================================
function retrieveUserData() {
    try {
        var jsonParse = JSON.parse(fs.readFileSync('./userDB.json', 'utf8'));
    }
    catch (err) {
        // If user database file does not exist:
        if (err.code === "ENOENT") {
            console.log("No user database exists".reject);
            // var jsonWrite = JSON.stringify(testDatabase);
            // fs.writeFileSync("userDB.json", jsonWrite, "utf8");
            process.exit(1);
        } else {
            throw(err);
        }
    }

    for (var i = 0; i < jsonParse.table.length; i++) {
        var currUser = jsonParse.table[i];
        if (currUser.username == args[2]) {
            user = currUser;
            break;
        }
    }

    if (user.username == null) {
        console.log("Could not find user".reject);
        process.exit(1);
    }

    editUserInfoLoop();
    //TODO: Update user info in database
}

function editUserInfo() {
    console.log("\nWhich fields are incorrect?".reject);
    console.log("1:" + " First name".info);
    console.log("2:" + " Last name".info);
    console.log("3:" + " Address".info);
    console.log("4:" + " Email".info);
    console.log("5:" + " Phone Number".info);
    var fields = rl.question("List the numbers of the incorrect fields, separated by a space:\n".prompt).split(" ");
    for (var i = 0; i < fields.length; i++) {
        var field = parseInt(fields[i]);
        if (field == NaN) {
            console.log("Malformed input detected. Please try again:".reject);
            editUserInfo();
            break;
        }

        switch (field) {
            case 1:
                user.firstName = rl.question("First name: ".prompt);
                break;
            case 2:
                user.lastName = rl.question("Last name: ".prompt);
                break;
            case 3: 
                console.log("<house number> <street>, <city>, <state>, <zip>".info);
                user.address = rl.question("Address (format as above): ".prompt);
                break;
            case 4:
                user.email = rl.question("Email: ".prompt);
                break;
            case 5:
                user.phoneNumber = rl.question("Phone number: ".prompt);
                break;
            default:
                console.log("Incorrect field number: '".reject + colors.reject(field) + "'".reject);
        }
    }
}

function editUserInfoLoop() {
    printUserInfo();
    do {
        var response = rl.question("Is the above information correct? y/n: ".prompt).toLowerCase();
        if (response == "n") {
            editUserInfo();
            printUserInfo();
            response = null;
        }
    } while (!(["y", "n"].includes(response)));
}

function inputUserData() {
    user.firstName = rl.question("First name: ".prompt);
    user.lastName = rl.question("Last name: ".prompt);
    console.log("<house number> <street>, <city>, <state>, <zip>".info);
    user.address = rl.question("Address (format as above): ".prompt);
    user.phoneNumber = rl.question("Phone Number: ".prompt);
    user.email = rl.question("Email: ".prompt);

    editUserInfoLoop();
}

function printUserInfo() {
    console.log("\nFirst Name: ".affirm + user.firstName);
    console.log("Last Name: ".affirm + user.lastName);
    console.log("Address: ".affirm + user.address);
    console.log("Phone Number: ".affirm + user.phoneNumber);
    console.log("Email: ".affirm + user.email + "\n");
}

function findStore() {
    return new Promise((resolve, reject) => {

        pizzapi.Util.findNearbyStores(
            user.address,
            'Delivery',
            (storeSearch) => {

                if (!storeSearch.success || storeSearch.result.Stores.length == 0) {
                    var err = "\nCould not find any store near you.\n".reject;
                    reject(err);
                } else if (storeSearch.result.Granularity !== "Exact") {
                    var err = "\nAddress may have been malformed. Could not find precise match for Dominos store.\n".reject;
                    reject(err);
                } else {
                    var selectStore = storeSearch.result.Stores[0];

                    if (!selectStore.IsOpen) {
                        console.log("\nYour nearest Dominos pizza store is not open at the moment. No pizza time :(\n".reject);
                        process.exit(0);
                        // TODO: REMOVE ABOVE
                    }
                    console.log("\nYour Dominos pizza store:\n".affirm);
                    console.log("StoreID: ".info + colors.italic(selectStore.StoreID));
                    console.log("Location: ".info + colors.italic(selectStore.AddressDescription));
                    console.log("Hours: ".info + colors.italic(selectStore.HoursDescription + "\n"));

                    resolve(selectStore.StoreID);
                }

            }
        );

    });
}

function menuHandler(menuResponse) {
    return new Promise((resolve, reject) => {
        userStore.getMenu(storeData => {
            var orderItems = [];

            do {
                if (menuResponse === "b") {
                    var pizza = buildPizza(storeData, reject);
                    orderItems.push(pizza);
                } else if (menuResponse === "q") {
                    var products = quickMenu(storeData, reject);
                    orderItems.push(products);
                }

                do {
                    menuResponse = rl.question(colors.prompt("\nWould you like to build a pizza, look at the quick menu," +
                                                             "\nor finish your order? (b/q/f): ")).toLowerCase();
                } while (!["b", "q", "f"].includes(menuResponse));
            } while (menuResponse !== "f");

            resolve(orderItems);
        });
    });
}

function buildPizza(storeData, reject) {
    console.log("\nBuild Your Own Pizza: ===================================================\n".affirm);
    if (!storeData.menuData.success) {
        var err = "Could not retrieve menu.".reject;
        reject(err);
    }

    var availableSizes = [];

    if (storeData.menuData.result.Variants["10SCREEN"]) {
        availableSizes.push("10");
    }
    if (storeData.menuData.result.Variants["12SCREEN"]) {
        availableSizes.push("12");
    }
    if (storeData.menuData.result.Variants["14SCREEN"]) {
        availableSizes.push("14");
    }

    var questionSize = "What size pizza?";
    for (var i in availableSizes) {
        questionSize = questionSize + " " + availableSizes[i] + "\"";
    }
    questionSize += "?: ";

    var sizeChoice;
    do {
        sizeChoice = rl.question(questionSize.prompt).toLowerCase().replace("\"", "");
    } while (!availableSizes.includes(sizeChoice));

    var pizzaCode = sizeChoice + "SCREEN";

    console.log("\nSauces:\n".affirm);

    var availableSauces = [];
    for (var i in storeData.menuData.result.Toppings.Pizza) {
        var sauce = storeData.menuData.result.Toppings.Pizza[i];
        if (sauce.Code.includes("X")) {
            if (storeData.menuData.result.Products["S_PIZZA"].AvailableToppings.includes(sauce.Code)) {
                availableSauces.push(sauce.Code);
                console.log(sauce.Code + ": " + colors.info(sauce.Name));
            }
        }
    }

    var sauceChoice;
    do {
        sauceChoice = rl.question(colors.prompt("\nChoose which sauce you want for your pizza.\nUse one of " +
                                    "the sauce codes indicated above (default is \"X\"): "));
        if (sauceChoice === "") {
            sauceChoice = "X";
        }
    } while (!availableSauces.includes(sauceChoice));

    var cheeseChoice;
    do {
        cheeseChoice = rl.question("\nDo you want cheese on your pizza? y/n: ".prompt).toLowerCase();
    } while (!["y", "n"].includes(cheeseChoice));
    
    console.log("\nToppings:\n".affirm);

    var availableToppings = [];
    for (var i in storeData.menuData.result.Toppings.Pizza) {
        var topping = storeData.menuData.result.Toppings.Pizza[i];
        var token = topping.Code + ",";
        if (storeData.menuData.result.Products["S_PIZZA"].AvailableToppings.includes(token)
            && topping.Code !== "C" && !(topping.Code.includes("X"))) {
            availableToppings.push(topping.Code);
            console.log(topping.Code + ": " + colors.info(topping.Name));
        }
    }

    var toppingsChoice;
    do {
        toppingsChoice = rl.question(colors.prompt("\nChoose up to 10 toppings for your pizza.\nUse the " + 
                                        "topping codes indicated above and separate by spaces:\n"));
        toppingsChoice = toppingsChoice.split(" ");
        var validInput = true;

        if (toppingsChoice.length > 10) {
            console.log("Too many toppings! 10 is the max!".reject);
            validInput = false;
        }

        for (var i in toppingsChoice) {
            if (!availableToppings.includes(toppingsChoice[i])) {
                validInput = false;
                console.log(colors.reject("The topping '" + toppingsChoice[i] + "' is invalid."));
            }
        }
    } while (!validInput);

    if (cheeseChoice === "y") toppingsChoice.push('C');
    toppingsChoice.push(sauceChoice);

    var quantityChoice;
    do {
        quantityChoice = rl.question("\nWhat quantity of this pizza would you like? (Maximum is 25): ".prompt);
        quantityChoice = parseInt(quantityChoice);
    } while (isNaN(quantityChoice) || quantityChoice <= 0 || quantityChoice > 25);

    var pizza = new pizzapi.Item(
        {
            code: pizzaCode,
            options: toppingsChoice,
            quantity: quantityChoice
        }
    );

    return pizza;
}

function quickMenu(storeData, reject) {
    console.log("\nQuick Menu: ============================================================\n".affirm);
    if (!storeData.menuData.success) {
        var err = "Could not retrieve menu.".reject;
        reject(err);
    }

    var possibleProducts = [];
    var index = 1;
    for (var i in storeData.menuData.result.PreconfiguredProducts) {
        var item = storeData.menuData.result.PreconfiguredProducts[i];
        possibleProducts.push(item.Code);
        console.log(index + ": " + colors.info(item.Name) + " (".info + colors.italic(item.Code) + ")".info);
        index++;
    }

    var products;

    var productChoices;
    do {
        products = [];
        productChoices = rl.question(colors.prompt("\nEnter the numbers of the products you would " +
                                        "like to order,\nseparated by a space. If you want multiple " +
                                        "quantities of an item,\nplace a comma directly after the product " +
                                        "number and enter the\nnumerical quantity desired.\nFor example: ") + 
                                        "1 4 2,3 5,6 12 24\n".info);
        productChoices = productChoices.split(" ");
        for (var i in productChoices) {
            productChoices[i] = productChoices[i].split(",");
        }

        var validInput = true;
        for (var i in productChoices) {
            var productNum;
            var productQuantity = 1;

            if (productChoices[i].length > 1) {
                if (productChoices[i].length > 2) {
                    console.log("\nInvalid input! Please check example formatting in instructions.".reject);
                    validInput = false;
                    break;
                }
                
                productNum = parseInt(productChoices[i][0]);
                productQuantity = parseInt(productChoices[i][1]);
            } else {
                var productNum = parseInt(productChoices[i]);
            }

            if (isNaN(productNum) || productNum <= 0 || productNum > possibleProducts.length || isNaN(productQuantity)) {
                console.log("\nInvalid input! Please check example formatting in instructions.".reject);
                validInput = false;
                break;
            } else if (productQuantity > 10) {
                console.log(colors.reject("\nQuantity of product #" + productChoices[i][0] + 
                                            " is greater than 10. Please choose a lower quantity.\n"));
                validInput = false;
                break;
            } else {
                var productCode = possibleProducts[productNum - 1];
                products.push(
                    new pizzapi.Item(
                        {
                            code:productCode,
                            quantity:productQuantity
                        }
                    )
                );
            }
        }
    } while (!validInput);

    return products;
}

function orderHandler(orderItems) {
    do {
    var payChoice = rl.question("\nWould you like to pay by credit card or cash? (credit/cash): ".prompt);
    } while (!(["credit", "cash"].includes(payChoice)));
    
    if (payChoice === "credit") {
        do {
            var ccNum = parseInt(rl.question("\nCredit card number: ".prompt).trim);

            var visaRegEx = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
            var mastercardRegEx = /^(?:5[1-5][0-9]{14})$/;
            var amexpRegEx = /^(?:3[47][0-9]{13})$/;
            var discovRegEx = /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/; 
            var isValid = false;

            if (visaRegEx.test(ccNum)) {
                isValid = true;
            } else if(mastercardRegEx.test(ccNum)) {
                isValid = true;
            } else if(amexpRegEx.test(ccNum)) {
                isValid = true;
            } else if(discovRegEx.test(ccNum)) {
                isValid = true;
            }

            if (!isValid) {
                console.log("Invalid credit card number. Please try again.".reject)
            }
        } while (!isValid);
    }

    var customer = new pizzapi.Customer(
        {
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            email: user.email
        }
    );

    var order = new pizzapi.Order(
        {
            customer: customer,
            storeID: userStore.ID,
            deliveryMethod: 'Delivery'
        }
    );

    for (var i in orderItems) {
        order.addItem(orderItems[i]);
    }

    order.price(result => {
        console.log(result.result.Order.Products);
        console.log(result.result.StatusItems)
    });
}
