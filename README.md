# NEXA — Business Management System

![Node.js](https://img.shields.io/badge/Node.js-backend-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-database-4479A1?logo=mysql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?logo=railway&logoColor=white)

**A full-stack business management application built with Node.js, Express and MySQL.**

NEXA is a web-based management system that brings essential business operations together in a single application. It provides tools for managing customers, products, orders, appointments, notifications, user accounts and system settings through a centralized dashboard.

The project was developed by **Emanuele Nassisi** as a hands-on software engineering project, with a focus on backend development, database integration, authentication, security and practical application design. NEXA began as a local application and was subsequently deployed online using Railway.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Security](#security)
- [Deployment](#deployment)
- [What I Learned](#what-i-learned)
- [Future Development](#future-development)
- [Author](#author)

---

## Overview

NEXA aims to simplify business management by bringing multiple operational tools into one centralized interface. Instead of treating each function as a separate application, it connects the frontend, backend and relational database into a single system.

The application was developed incrementally, starting from its core functionality and progressively adding authentication, account management, notifications, backups, data export and additional administrative tools.

The first major milestone, **NEXA 1.0**, was completed in October 2026 and deployed online.

---

## Features

### Dashboard and Business Management

- Centralized management interface
- Customer management
- Product and service management
- Order management
- Appointment management
- Relational data management through MySQL

### Authentication and Account Security

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication using cookies
- Authentication and authorization middleware
- Password recovery
- Two-factor authentication (2FA)
- Account settings and security-related controls

### Notifications

- In-application notifications
- Notification preferences and important-notification handling
- Real-time delivery with Socket.IO
- Email notifications through a transactional email provider (HTTP API)

### Data Management

- Data export with ExcelJS
- Database backups, both scheduled and manual
- Dedicated management of customers, products, orders and appointments

### Additional Tools

- Centralized settings
- Help Center and user guides
- Account and avatar management
- Administrative functionality
- Configurable backend services through environment variables

> Feature availability may depend on the current application configuration and deployment environment.

---

## Technology Stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Application structure |
| CSS3 | Styling and interface layout |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | HTTP server and API routing |
| MySQL | Relational database |
| bcrypt | Password hashing |
| JSON Web Tokens (JWT) | Authentication |
| cookie-parser | Cookie handling |
| Helmet | HTTP security headers and Content Security Policy |
| CORS | Cross-origin request configuration |
| express-rate-limit | Request rate limiting |
| Socket.IO | Real-time communication |
| Brevo (transactional email API) | Email delivery |
| Cloudinary | Avatar image storage |
| otplib and qrcode | Two-factor authentication |
| node-cron | Scheduled backups |
| ExcelJS | Spreadsheet generation and data export |
| Railway | Online deployment |

The backend uses a modular structure that separates routing, controllers, middleware and configuration.

---

## Architecture

NEXA follows a client-server architecture.

```text
User
 |
 v
Frontend
HTML / CSS / JavaScript
 |
 | HTTP requests, cookies and WebSocket
 v
Node.js / Express Backend
 |
 +-- Routes
 +-- Controllers
 +-- Middleware
 +-- Configuration
 +-- Authentication and Authorization
 +-- Notification Services
 |
 v
MySQL Database
```

Additional services support email delivery, image storage, real-time communication, backups and spreadsheet exports.

The backend processes requests, validates access, executes business logic and interacts with the database. The frontend communicates only with the backend and never connects directly to MySQL.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A running MySQL server
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file in the project root. See [Environment Configuration](#environment-configuration).

### 4. Configure MySQL

Create an empty database and import the database schema before the first run.

> **Warning:** never use a production database for local development or for testing destructive operations.

### 5. Start the application

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The application serves both the API and the frontend. With the default configuration, open `http://localhost:3000`.

---

## Environment Configuration

NEXA relies on environment variables for database access, authentication and external services. Use the variable names below, with your own values:

```env
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
USER_DB=your_database_user
PASSWORD_DB=your_database_password
DB_NAME=your_database_name

# Authentication
JWT_SECRET=your_long_random_secret

# Email (transactional email API)
BREVO_API_KEY=your_api_key
MAIL_FROM=Nexa <noreply@your-verified-domain.com>

# Image storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Backups (optional, useful with a persistent volume)
BACKUP_DIR=./backups
```

> **Never** commit `.env` files, production credentials, JWT secrets or private database information to GitHub. Add `.env` and `node_modules` to `.gitignore`, and use your hosting provider's environment-variable settings in production.

---

## Security

Security is an important part of NEXA's backend design. The application includes:

- Password hashing with bcrypt
- JWT-based authentication with cookie sessions
- Authentication middleware and authorization checks for protected operations
- Password recovery and two-factor authentication
- HTTP security headers and a Content Security Policy through Helmet
- CORS configuration
- Rate limiting, with a stricter limit on login attempts
- Environment-based secret management

These mechanisms must be configured correctly in production. Security also depends on validating requests, enforcing permissions on the backend, protecting sensitive endpoints and keeping dependencies updated.

Production deployments should use HTTPS, restricted database access (private network only), secure cookie settings and reliable backup procedures.

---

## Deployment

NEXA is deployed on [Railway](https://railway.com/).

The deployed environment includes:

- A Node.js service serving the API and the frontend
- A MySQL database reached through Railway's private network
- Environment-specific configuration
- Cloudinary for avatar storage
- A transactional email provider reached over HTTPS

Deployment requires the correct environment variables, database configuration, allowed origins and production-compatible authentication settings.

> Some hosting plans block outbound SMTP, which is why NEXA sends email through an HTTP API instead. Sender verification and the provider's service limits also apply.

---

## What I Learned

Developing NEXA provided practical experience in several areas.

**Backend development**

- Building a Node.js application with Express
- Organizing routes, controllers and middleware
- Implementing authentication and authorization
- Handling requests, responses and errors
- Integrating external services

**Database management**

- Working with MySQL and relational data structures
- Writing SQL queries
- Managing relationships between business entities
- Implementing database backups and data export
- Handling differences between database engines and versions

**Authentication and security**

- Password hashing, JWTs and cookies
- Protecting backend routes
- Managing authentication workflows
- Configuring security middleware and environment variables

**Full-stack integration**

- Connecting frontend functionality to backend endpoints
- Managing configuration across environments
- Debugging issues that span multiple application layers

**Deployment and problem solving**

- Deploying a Node.js application online
- Connecting a hosted backend to a hosted database
- Troubleshooting configuration and runtime errors
- Understanding the differences between local development and production

One of the most valuable lessons was learning to work through problems that only appeared when different parts of the application interacted. NEXA was not developed in a single step: it evolved through implementation, testing, debugging and continuous refinement.

---

## Future Development

NEXA 1.0 establishes the foundation for future improvements. Planned areas of development:

- **Localization:** configurable interface language, date and number formats, and currency preferences
- **NEXA AI:** AI-assisted workflows integrated with the application's existing backend capabilities
- **NEXA 3.0:** expanded payment management, more granular authorization controls and additional business functionality
- **Further improvements:** additional pages, usability enhancements, security refinements and maintenance

These are planned directions, not features necessarily included in the current release.

---

## Author

**Emanuele Nassisi**

Developer and creator of NEXA.

GitHub: [Emanuele Nassisi](https://github.com/emanuelenassisi007-cyber)

---

*Built from the ground up as a practical full-stack development project. NEXA represents an ongoing journey in software engineering, backend development and application design.*
