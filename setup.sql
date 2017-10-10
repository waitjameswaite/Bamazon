DROP DATABASE IF EXISTS Bamazon;
CREATE database Bamazon;

USE Bamazon;

CREATE TABLE Products (
    ItemID INTEGER(11) AUTO_INCREMENT NOT NULL,
    ProductName VARCHAR(50) NOT NULL,
    DepartmentName VARCHAR(50) NOT NULL,
    Price FLOAT(7, 2) NOT NULL,
    StockQuantity INTEGER(7) NOT NULL,
    PRIMARY KEY (ItemID)
);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Headphones', 'Electronics', 19.99, 50);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('LED TV', 'Electronics', 179.99, 20);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Basketball', 'Sports', 24.99, 30);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Toy Car', 'Toys and Games', 4.99, 35);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Fidget Spinner', 'Toys and Games', 4.99, 2000);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Playing Cards', 'Toys and Games', 2.89, 40);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Printer Paper', 'Office Supplies', 1.50, 150);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Chef Knife', 'Kitchen', 49.99, 10);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('WELCOME! Mat', 'Home', 13.99, 20);

INSERT INTO Products (ProductName, DepartmentName, Price, StockQuantity)
VALUES ('Bike Helmet', 'Sports', 74.99, 12);

SELECT * FROM Products;