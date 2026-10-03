# Overview

As a software engineer, I wanted to replace a fragile Excel-based workflow with a real, structured system backed by a cloud database. At my job, client, product, and sales records were being tracked in a spreadsheet — a setup where a single broken formula or an accidental edit could corrupt critical business data with no way to recover it. I built this project to solve that problem for good: a proper backend with validated inserts, role-based access, and data that lives safely in the cloud instead of a local file.

This software is a Sales and Client Management System built with Node.js and Express, using MongoDB Atlas as the cloud database. It exposes a REST API with four main resources — products, clients, users, and sales — and secures them with JWT-based authentication and role-based authorization (boss, seller, warehouse, customer). Each role sees and can modify only what it should: a warehouse worker can update stock but never sees prices, a seller can register sales but only view their own, and a customer can only see their own purchase history.

To use the program, a client sends HTTP requests to the API (tested with Postman/Thunder Client). A user logs in via `POST /users/login` to receive a JWT, which must be included as a `Bearer` token in the `Authorization` header on every subsequent request. From there, the API supports full CRUD on products, clients, and sales, with business rules enforced server-side — for example, a sale is automatically rejected if there isn't enough stock in the selected store, and stock is only decremented once every item in the sale has been validated.

I wrote this software to deepen my understanding of how to design and secure a real-world cloud-backed API: structuring related collections in a NoSQL database, enforcing authorization at the data level (not just the route level), and handling business logic like inventory deduction safely.

[Software Demo Video](https://youtu.be/hjChyzLvmFw)

# Cloud Database

This project uses **MongoDB Atlas**, a cloud-hosted, document-based (NoSQL) database, accessed through the official `mongodb` Node.js driver.

The database is organized into four collections:

- **`products`** — stores each product's name, sale price, acquisition cost, and stock levels per store (two physical stores: Manuel Bulnes and Barros Arana), represented as an array of `{ store, quantity }` objects.
- **`users`** — stores login credentials (email, bcrypt-hashed password) and a `role` field (`boss`, `seller`, `warehouse`, or `customer`) used for authorization.
- **`clients`** — stores the commercial data of each customer (name, addresses, phone numbers, personal/company tax IDs), linked to its corresponding `users` document through a `userId` field.
- **`sales`** — stores each sale's customer, seller, store, and line items. Each line item captures a snapshot of the unit price and subtotal at the time of the sale (so future price changes never alter historical sales), along with the sale's total and payment type/method.

`sales.customerId` and `sales.sellerId` both reference the `_id` of a `users` document directly (not `clients`), so a logged-in customer's own sales history can be queried in a single lookup using the ID already available from their login token.

# Development Environment

- **Visual Studio Code** as the code editor
- **Node.js** (v25) as the runtime
- **Postman** for testing API endpoints
- **MongoDB Atlas** as the cloud database platform, managed through its web interface

**Language and libraries:**
- **JavaScript (Node.js)**
- **Express** — web framework for routing and middleware
- **mongodb** — official MongoDB driver for Node.js
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT creation and verification for authentication
- **dotenv** — environment variable management
- **body-parser** — request body parsing

# Useful Websites

- [MongoDB Node.js Driver Documentation](https://www.mongodb.com/docs/drivers/node/current/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Express.js Documentation](https://expressjs.com/)
- [jsonwebtoken (npm)](https://www.npmjs.com/package/jsonwebtoken)
- [bcryptjs (npm)](https://www.npmjs.com/package/bcryptjs)
- [MongoDB Crash Course] (https://www.youtube.com/watch?v=ofme2o29ngU)

# Future Work

- Combine stock from both stores to fulfill a single sale when one store alone doesn't have enough inventory, instead of rejecting the sale outright
- Wrap the stock-check-and-decrement logic in `createSale` in a proper MongoDB transaction to fully prevent race conditions under concurrent sales
- Allow editing the products and quantities of an existing sale (currently only payment type/method can be updated after creation)
- Add pagination and filtering (by date, store, customer) to `GET /sales` and `GET /products` for better scalability as data grows