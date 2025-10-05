# 🏥 MediNearby

MediNearby is a modern web application that helps users easily locate **nearby hospitals, clinics, and pharmacies**.  
Built using **React**, **Tailwind CSS**, and **Firebase**, it offers a smooth, fast, and responsive user experience.

---

## 📚 Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)

---

## 🚀 Introduction

**MediNearby** makes it simple to find healthcare facilities around you.  
With built-in location detection and clean UI design, it ensures users can access critical medical services quickly and conveniently.

---

## ✨ Features

- 🗺️ **Location-based Search** – Find nearby healthcare facilities in real time.  
- 🔥 **Firebase Integration** – For authentication and data management.  
- 🎨 **Responsive UI** – Built with Tailwind CSS for modern, mobile-friendly design.  
- 🔔 **Toast Notifications** – Instant feedback and updates using React Toastify.  
- ⚡ **Optimized Performance** – Powered by React and React Router DOM.  

---

## 🧰 Tech Stack

- **Frontend**: React 18, Tailwind CSS 3  
- **Routing**: React Router DOM  
- **Icons**: Font Awesome, Lucide React  
- **Notifications**: React Toastify  
- **Backend / Auth**: Firebase  
- **Deployment**: Vercel / Netlify  

---

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/spant671-ux/MediNearby.git

# Go to the project directory
cd MediNearby

# Install dependencies
npm install

# Start the development server
npm start
```
---

## 💻 Usage

- Run npm start to launch the app.

- Allow location access when prompted.

- Browse the nearby hospitals, clinics, or pharmacies.

- Click on any facility to view its details or directions.
---

## 🔧 Configuration

Create a .env file in the project root and add your Firebase configuration keys:
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```
---
## 📁 Project Structure
```bash
MediNearby/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── App.js
│   └── index.js
├── package.json
└── tailwind.config.js
```
---
## 🧪 Available Scripts
| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm start`     | Run the app in development mode           |
| `npm run build` | Build the app for production              |
| `npm run eject` | Eject the configuration for customization |

