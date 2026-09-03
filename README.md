# Savora — Personal Finance Management App

Savora is a full-stack personal finance management web application designed to help users manage their financial information in one place.

Users can manage accounts, track income and expenses, organize transactions, create budgets, and set financial goals through a clean and responsive dashboard.

## 🌐 Live Demo

[Visit Savora](https://savora-fawn.vercel.app)

## 📂 GitHub Repository

[View the Source Code](https://github.com/arshidabdulla58-cell/Savora)

---

## ✨ Features

### 🔐 Authentication
- User registration
- User login
- JWT-based authentication
- Protected application routes
- Persistent authentication using browser storage

### 💰 Account Management
- Create and manage financial accounts
- Track account balances
- Organize different sources of funds

### 💳 Transaction Management
- Record income and expenses
- Associate transactions with accounts
- Categorize transactions
- View transaction history

### 🏷️ Categories
- Organize transactions using categories
- Separate income and expense categories

### 📊 Dashboard & Analytics
- Financial overview
- Account summaries
- Transaction summaries
- Interactive charts and visualizations
- Spending analysis

### 💵 Budget Management
- Create budgets
- Track spending against budgets
- Monitor financial limits

### 🎯 Financial Goals
- Create savings goals
- Track progress toward goals
- Monitor financial targets

### 📱 Responsive Design
- Desktop-friendly interface
- Mobile-friendly navigation
- Responsive dashboard components

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Lucide React
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- JWT

### Database

- PostgreSQL
- Prisma ORM

### Deployment

- Vercel — Frontend
- Render — Backend
- Render PostgreSQL — Database

### Version Control

- Git
- GitHub

---

## 🏗️ Architecture

```text
                         User
                          │
                          ▼
                ┌──────────────────┐
                │ React Frontend   │
                │ TypeScript + Vite│
                └────────┬─────────┘
                         │
                       Axios
                         │
                         ▼
                ┌──────────────────┐
                │ Express Backend  │
                │ Node.js + TS     │
                └────────┬─────────┘
                         │
                       Prisma
                         │
                         ▼
                ┌──────────────────┐
                │   PostgreSQL     │
                │    Database      │
                └──────────────────┘
