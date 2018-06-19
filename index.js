const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

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

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/math', math)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
