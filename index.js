const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

function math_service (req, res) {
    var op1 = parseInt(req.query.operand1);
    var op2 = parseInt(req.query.operand2);
    var operation = req.query.operation;
    var result = 0.0;

    console.log("Operand 1: " + op1);
    console.log("Operand 2: " + op2);
    console.log("Operation: " + operation);

    if (operation == "add") {
        result = op1 + op2;
    } else if (operation == "subtract") {
        result = op1 - op2;
    } else if (operation == "multiply") {
        result = 1.0 * op1 * op2;
    } else if (operation == "divide") {
        result = 1.0 / op1 / op2;
    }
    console.log("Result: " + result);

    res.json({result: result});
}

function math (req, res) {
    var op1 = parseInt(req.query.operand1);
    var op2 = parseInt(req.query.operand2);
    var operation = req.query.operation;
    var result = 0.0;

    console.log("Operand 1: " + op1);
    console.log("Operand 2: " + op2);
    console.log("Operation: " + operation);

    if (operation == "add") {
        result = op1 + op2;
    } else if (operation == "subtract") {
        result = op1 - op2;
    } else if (operation == "multiply") {
        result = 1.0 * op1 * op2;
    } else if (operation == "divide") {
        result = 1.0 / op1 / op2;
    }
    console.log("Result: " + result);

    res.render('pages/result', {result: result});
}

function postage_calc (req, res) {
  var weight = parseInt(req.query.weight);
  var service = req.query.service;

  console.log("Weight: " + weight);
  console.log("Service: " + service);

  var valid = true;
  var cost = 0.0;
  var error = "";
  if (req.query.weight == "") {
    valid = false;
    error = "You're not shipping anything.";
  } else {
    switch (service) {
        case "lstamp":
            if (weight <= 1) {
                cost = 0.50;
            } else if (weight <= 2) {
                cost = 0.71;
            } else if (weight <= 3) {
                cost = 0.92;
            } else if (weight <= 3.5) {
                cost = 1.13;
            } else {
                valid = false;
                error = "For letters over 3.5 oz, you must use the Large Envelopes rates.";
            }
            break;
        case "lmeter":
            if (weight <= 1) {
                cost = 0.47;
            } else if (weight <= 2) {
                cost = 0.68;
            } else if (weight <= 3) {
                cost = 0.89;
            } else if (weight <= 3.5) {
                cost = 1.10;
            } else {
                valid = false;
                error = "For letters over 3.5 oz, you must use the Large Envelopes rates.";
            }
            break;
        case "flats":
            if (weight <= 1) {
                cost = 1.00;
            } else if (weight <= 2) {
                cost = 1.21;
            } else if (weight <= 3) {
                cost = 1.42;
            } else if (weight <= 4) {
                cost = 1.63;
            } else if (weight <= 5) {
                cost = 1.84;
            } else if (weight <= 6) {
                cost = 2.05;
            } else if (weight <= 7) {
                cost = 2.26;
            } else if (weight <= 8) {
                cost = 2.47;
            } else if (weight <= 9) {
                cost = 2.68;
            } else if (weight <= 10) {
                cost = 2.89;
            } else if (weight <= 11) {
                cost = 3.10;
            } else if (weight <= 12) {
                cost = 3.31;
            } else if (weight <= 13) {
                cost = 3.52;
            } else {
                valid = false;
                error = "Large Envelopes service cannot be used for items over 13 oz.";
            }
            break;
        case "package":
            if (weight <= 4) {
                cost = 3.50;
            } else if (weight <= 8) {
                cost = 3.75;
            } else if (weight <= 9) {
                cost = 4.10;
            } else if (weight <= 10) {
                cost = 4.45;
            } else if (weight <= 11) {
                cost = 4.80;
            } else if (weight <= 12) {
                cost = 5.15;
            } else if (weight <= 13) {
                cost = 5.50;
            } else {
                valid = false;
                error = "First-Class Package Service cannot be used for items over 13 oz.";
            }
            break;
        }
  }
  res.render('pages/postage', {valid: valid, error: error, cost: cost});
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/math', math)
  .get('/math_service', math_service)
  .get('/postage', postage_calc)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
