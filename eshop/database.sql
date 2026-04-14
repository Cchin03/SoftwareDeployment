-- Create the database
CREATE DATABASE IF NOT EXISTS eshop_db;
USE eshop_db;

-- 1. Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE Categories (
    category_id VARCHAR(50) PRIMARY KEY, -- e.g., 'electronics', 'fashion'
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color_class VARCHAR(100),
    description TEXT
);

-- 3. Products Table
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    emoji VARCHAR(10), -- Placeholder for future image_url
    rating DECIMAL(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- 4. Cart Table (Mapping Users to Products)
CREATE TABLE Cart_Items (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

INSERT INTO Categories (category_id, name, icon, color_class) VALUES 
('electronics', 'Electronics', '⚡', 'bg-sky-50 border-sky-200'),
('fashion', 'Fashion', '👗', 'bg-rose-50 border-rose-200');

INSERT INTO Products (category_id, name, price, emoji) VALUES 
('electronics', 'MacBook Pro 16"', 2499.00, '💻'),
('electronics', 'Sony WH-1000XM5', 279.00, '🎧'),
('fashion', 'Nike Air Force 1', 110.00, '👟');