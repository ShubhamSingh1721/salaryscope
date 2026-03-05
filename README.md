# SalaryScope

**SalaryScope** is a smart web application that converts offer letters into clear, structured salary insights.
It helps students and job-seekers understand the real breakdown of their salary, including take-home pay, allowances, deductions, and total compensation.

Instead of manually calculating complex salary structures from offer letters, SalaryScope automatically extracts and analyzes the data to present it in an easy-to-understand dashboard.

---

# Project Overview

Offer letters often contain complex salary structures that are difficult to interpret. SalaryScope simplifies this process by extracting salary components directly from uploaded PDF offer letters and converting them into structured insights.

The system uses AI-powered extraction and automated calculations to provide a transparent breakdown of compensation, helping users make better career decisions.

---

# Key Features

## PDF Upload & Extraction

Users can upload their offer letter in PDF format.

The system automatically extracts text from the uploaded PDF using an automated parsing system.

This eliminates the need for manual entry of salary details.

---

## AI-Powered Salary Data Extraction

SalaryScope uses **Google Gemini AI** to identify and extract structured salary information such as:

* Base Salary
* House Rent Allowance (HRA)
* Performance Bonus
* Provident Fund (PF)
* Special Allowances
* Total CTC
* Monthly Take-Home

The AI follows predefined rules to infer missing salary components when necessary.

---

## Smart Salary Calculations

If the take-home salary is not explicitly mentioned in the offer letter, the system calculates it automatically.

It applies common deductions and rules such as:

* EPF deduction
* Professional tax
* Income tax (based on the new tax regime)

Allowances like HRA, bonus, and special allowances are included in the calculations.

Monthly values are calculated by dividing annual amounts by 12 and rounding them for clarity.

---

## Dashboard & Visualization

SalaryScope provides an intuitive dashboard for understanding compensation details.

### User Dashboard

Users can view and manage their uploaded offer letters and processed salary data.

### Salary Dashboard

Displays a visual breakdown of all salary components for better understanding.

### Offer Comparison

Users can compare multiple job offers side-by-side to make better decisions.

---

## Authentication & User Management

The application supports secure user authentication.

Features include:

* Email-based login
* OTP verification
* Anonymous upload mode for demo users

Authenticated users can save their offer letters and revisit them anytime.

---

## Modern UI & User Experience

The frontend is built with **Next.js and Tailwind CSS** to deliver a modern and responsive user interface.

Key UI features include:

* Smooth animations and transitions
* Responsive layout for all devices
* Clean dashboard views
* Dedicated sections for upload, insights, and comparisons

---

## Security & Best Practices

Security and best practices are implemented across the application.

* API keys and sensitive configurations are stored securely in `.env` files
* `.gitignore` prevents secrets and build files from being uploaded to GitHub
* User data is stored safely using MongoDB
* Proper backend validation ensures secure data processing

---

# Tech Stack

### Frontend

* Next.js
* Tailwind CSS

### Backend

* Node.js
* Express.js

### AI Integration

* Google Gemini API

### Database

* MongoDB

---

# How It Helps Users

SalaryScope provides real value to students and job-seekers by helping them:

* Understand the full breakdown of their salary
* Clearly identify deductions and allowances
* Know their real monthly take-home pay
* Compare multiple job offers side-by-side
* Make data-driven career decisions

Instead of relying only on CTC numbers, users get a transparent view of their compensation.

---

# Installation

Clone the repository

```
git clone https://github.com/YOUR_USERNAME/salaryscope.git
```

Navigate to the project directory

```
cd salaryscope
```

Install dependencies

```
npm install
```

Create a `.env` file and add required environment variables.

Run the project

```
npm run dev
```

---

# Future Improvements

* Advanced salary analytics
* AI insights for compensation comparison
* Salary benchmarking based on industry data
* Export reports as PDF
* Interactive charts and salary predictions

---

# Author

**Shubham Singh**

BCA Final Year Student
Software Developer Intern

