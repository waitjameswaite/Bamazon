var Password = require('./password.js');

var mysql = require('mysql');
var Table = require('cli-table');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: Password,
    database: "Bamazon"
});

var shoppingCart = [];
var totalCost = 0;

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    printItems(function(){
      userSelectsItem();
    });
});

function printItems(cb){
  var table = new Table({
    head: ['ID Number', 'Product', 'Department', 'Price', 'Quantity Available']
  });
  connection.query('SELECT * FROM Products', function(err, res){
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      table.push([res[i].ItemID, res[i].ProductName, res[i].DepartmentName, '$' + res[i].Price.toFixed(2), res[i].StockQuantity]);
    }
    console.log(table.toString());
    cb();
    });
  }

function userSelectsItem(){
  var items = [];
  connection.query('SELECT ProductName FROM Products', function(err, res){
    if (err) throw err;
    for (var i = 0; i < res.length; i++) {
      items.push(res[i].ProductName)
    }
    inquirer.prompt([
      {
      name: 'choices',
      type: 'checkbox',
      message: 'Which products would you like to add to your cart?',
      choices: items
      }
    ]).then(function(user){
      if (user.choices.length === 0) {
        console.log('You didn\'t select anything.');
        inquirer.prompt([
          {
          name: 'choice',
          type: 'list',
          message: 'Your cart is empty, would you like to continue shopping or quit?',
          choices: ['Continue Shopping', 'Quit']
          }
        ]).then(function(user){
            if (user.choice === 'Continue Shopping') {
              printItems(function(){
                userSelectsItem();
              });
            } else {
              connection.end();
            }
        });
      } else {
        howManyItems(user.choices)
      }
      });
  });
}

function howManyItems(itemNames){
  var item = itemNames.shift();
  var itemStock;
  var department;
  connection.query('SELECT StockQuantity, Price, DepartmentName FROM Products WHERE ?', {
    ProductName: item
  }, function(err, res){
    if(err) throw err;
    itemStock = res[0].StockQuantity;
    itemCost = res[0].Price;
    department = res[0].DepartmentName;
  });
  inquirer.prompt([
    {
    name: 'amount',
    type: 'text',
    message: 'How many ' + item + ' would you like to purchase?',
    validate: function(str){
        if (parseInt(str) <= itemStock) {
          return true
        } else {
          console.log('\nWe only have ' + itemStock + ' of those in stock.');
          return false;
        }
      }
    }
  ]).then(function(user){
    var amount = user.amount;
    shoppingCart.push({
      item: item,
      amount: amount,
      itemCost: itemCost,
      itemStock: itemStock,
      department: department,
      total: itemCost * amount
    });
    if (itemNames.length != 0) {
      howManyItems(itemNames);
    } else {
      checkout();
    }
    });
}

function checkout(){
  if (shoppingCart.length != 0) {
    var grandTotal = 0;
    console.log('---------------------------------------------');
    console.log('This is your cart, are you ready to checkout?');
    for (var i = 0; i < shoppingCart.length; i++) {
      var item = shoppingCart[i].item;
      var amount = shoppingCart[i].amount;
      var cost = shoppingCart[i].itemCost.toFixed(2);
      var total = shoppingCart[i].total.toFixed(2);
      var itemCost = cost * amount;
      grandTotal += itemCost;
      console.log(amount + ' ' + item + ' ' + '$' + total);
    }
    console.log('Total: $' + grandTotal.toFixed(2));
    inquirer.prompt([
      {
        name: 'checkout',
        type: 'list',
        message: 'Ready to checkout?',
        choices: ['Checkout', 'Edit Cart']
      }
    ]).then(function(res){
        if (res.checkout === 'Checkout') {
            updateDB(grandTotal);
        } else {
          editCart();
        }
      });
  } else {
    inquirer.prompt([
      {
      name: 'choice',
      type: 'list',
      message: 'Your cart is empty, would you like to continue shopping or quit?',
      choices: ['Continue Shopping', 'Quit']
      }
    ]).then(function(user){
        if (user.choice === 'Continue Shopping') {
          printItems(function(){
            userSelectsItem();
          });
        } else {
          connection.end();
        }
    });

  }
}

function updateDB(grandTotal){
  var item = shoppingCart.shift();
  var itemName = item.item;
  var itemCost = item.itemCost
  var userPurchase = item.amount;
  var department = item.department;
  var departmentTransactionSale = itemCost * userPurchase;
  connection.query('SELECT TotalSales from Departments WHERE ?', {
    DepartmentName: department
  }, function(err, res){
    var departmentTotalSales = res[0].TotalSales;
    connection.query('UPDATE Departments SET ? WHERE ?', [
    {
      TotalSales: departmentTotalSales += departmentTransactionSale
    },
    {
      DepartmentName: department
    }], function(err){
      if(err) throw err;
    });
  });
  connection.query('SELECT StockQuantity from Products WHERE ?', {
    ProductName: itemName
  }, function(err, res){
    var currentStock = res[0].StockQuantity;
    connection.query('UPDATE Products SET ? WHERE ?', [
    {
      StockQuantity: currentStock -= userPurchase
    },
    {
      ProductName: itemName
    }], function(err){
      if(err) throw err;
      if (shoppingCart.length != 0) {
        updateDB(grandTotal);
      } else {
        grandTotal = grandTotal.toFixed(2);
        console.log('Thank you for your purchase.');
        console.log('Your total today was $' + grandTotal);
        connection.end();
      }
    });
  });
}

function editCart(){
  var items = [];
  for (var i = 0; i < shoppingCart.length; i++) {
    var item = shoppingCart[i].item;
    items.push(item);
  }
  inquirer.prompt([
    {
    name: 'choices',
    type: 'checkbox',
    message: 'Select the items you would like to edit.',
    choices: items
    }
  ]).then(function(user){
      if (user.choices.length === 0) {
        console.log('You didn\'t select anything to edit.');
        checkout();
      } else {
        var itemsToEdit = user.choices;
        editItem(itemsToEdit);
      }
  });
}

function editItem(itemsToEdit){
  if (itemsToEdit.length != 0) {
    var item = itemsToEdit.shift();
    inquirer.prompt([
      {
      name: 'choice',
      type: 'list',
      message: 'Would you like to remove ' + item + ' from your cart or change the quantity?',
      choices: ['Remove From My Cart', 'Change Quanity']
      }
    ]).then(function(user){
        if (user.choice === 'Remove From My Cart') {
          for (var i = 0; i < shoppingCart.length; i++) {
            if (shoppingCart[i].item === item) {
              shoppingCart.splice(i, 1);
              console.log('Updated!');
            }
          }
          editItem(itemsToEdit);
        } else {
          inquirer.prompt([
            {
            name: 'amount',
            type: 'text',
            message: 'How many ' + item + ' would you like to purchase?',
            }
          ]).then(function(user){
            for (var i = 0; i < shoppingCart.length; i++) {
              if (shoppingCart[i].item === item) {
                shoppingCart[i].amount = user.amount;
                shoppingCart[i].total = shoppingCart[i].itemCost * user.amount;
                console.log('Updated');
              }
            }
            editItem(itemsToEdit);
          });
        }
      });
  } else {
    checkout();
  }
}