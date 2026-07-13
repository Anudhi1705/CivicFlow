# CivicFlow – Ecological Civic Dispatch and Citizen Empowerment Portal

## Overview
CivicFlow is a full-stack web application designed to improve civic issue reporting and municipal transparency. It enables citizens to report geo-tagged civic issues, track complaint status, and interact with local authorities through a centralized platform. The system also includes an EcoHub module to promote sustainable waste management and environmental awareness.

---

## Features

- User Registration & Login (JWT Authentication)
- Role-Based Access (Citizen & Admin)
- Geo-tagged Issue Reporting using OpenStreetMap & Leaflet
- Complaint Status Tracking
- Public Complaint Feed with Upvote System
- Ward-wise Complaint Monitoring
- EcoHub for Recycling & E-Waste Information
- Admin Dashboard with Complaint Analytics
- Responsive User Interface

---

## Tech Stack

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- OpenStreetMap

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcrypt

### Database
- MongoDB Atlas

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Anudhi1705/CivicFlow.git
cd CivicFlow
Install Dependencies
npm install
Configure Environment Variables

Create a .env file and add:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
Run the Project

Development Mode

npm run dev

Production Build

npm run build
Application Workflow
User registers and logs in securely.
Citizen submits a civic issue with title, description, category, severity, and location.
Complaint location is captured using Leaflet and OpenStreetMap.
Backend validates the request and stores the complaint in MongoDB.
Complaint status is managed by the administrator.
Citizens can track complaint progress and upvote existing issues.
EcoHub provides nearby recycling and waste management information.
Security
JWT-based Authentication
Password Hashing using bcrypt
Role-Based Authorization
Protected REST APIs
Future Enhancements
AI-based Complaint Classification
SMS/Email/WhatsApp Notifications
Government API Integration
Mobile Application
IoT-based Smart Waste Monitoring
Author

Anudhi Mishra

MCA | Vivekanand Education Society's Institute of Technology (VESIT)

GitHub: https://github.com/Anudhi1705
