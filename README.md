# App-Store
<div align="center">

# 🚀 Mini App Store

### Modern Full-Stack Platform for Productivity Apps, Tools & Mini Games

<img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white"/>
<img src="https://img.shields.io/badge/Python-Language-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>
<img src="https://img.shields.io/badge/REST-API-orange?style=for-the-badge"/>

<br/>
<br/>

> A modern desktop-inspired web platform where users can install, launch, and manage multiple mini applications from a single interactive dashboard.

</div>

---

# 📌 Overview

**Mini App Store** is a full-stack web application inspired by desktop app marketplaces and operating system dashboards.

The platform centralizes multiple categories of applications including:

- 📌 Productivity tools
- 🛠️ Utility applications
- 🔐 Security tools
- 🎮 Mini games

Users can browse applications, install them dynamically, launch them instantly, and manage everything through a clean modern interface.

---

# ✨ Features

## 🔐 Authentication System

- User Registration
- User Login
- Session Management
- Protected Routes
- Secure Authentication Flow

---

## 📂 Application Management

- Install applications dynamically
- Open applications instantly
- Remove installed apps
- Organized category system
- Real-time application updates

---

## 🎨 Modern UI/UX

- Dark modern interface
- Responsive grid layout
- Animated components
- Interactive cards
- Smooth transitions
- Desktop-inspired experience

---

# 📱 Included Applications

## 📌 Productivity Apps

| Application | Description |
|---|---|
| Calculator | Perform arithmetic operations |
| Quick Notes | Save instant notes |
| Timer | Countdown & stopwatch |
| Task Scheduler | Organize daily tasks |
| Smart Notes AI | AI-assisted note management |
| Unit Converter | Convert between units |
| Expense Tracker | Manage expenses |
| Focus Mode | Pomodoro productivity timer |

---

## 🛠️ Utility Tools

| Application | Description |
|---|---|
| File Organizer | Automatically organize files |
| System Monitor | Monitor CPU & RAM usage |
| Music Player | Local audio player |
| Weather Dashboard | Real-time weather updates |

---

## 🔐 Security Tools

| Application | Description |
|---|---|
| Password Vault | Secure password management |
| Network Scanner | Scan local networks |

---

## 🎮 Mini Games

| Game | Description |
|---|---|
| Snake | Classic snake game |
| Tetris | Falling block puzzle |
| Memory Cards | Memory matching game |

---

# 🛠️ Tech Stack

## 🎨 Frontend

- React.js
- JavaScript
- CSS3
- Axios
- Lucide React

---

## 🖥️ Backend

- Python
- Flask
- REST API Architecture

---

## 💾 Database

- SQLite

---

# ⚙️ Project Architecture

```bash
mini-app-store/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── apps/
│   │   ├── styles/
│   │   └── App.jsx
│   │
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── database/
│   ├── models/
│   ├── app.py
│   └── requirements.txt
│
└── README.md

# ⚙️ Installation & Setup

## 📥 Clone the Repository

```bash
git clone https://github.com/yourusername/mini-app-store.git

cd mini-app-store
```

---

# 🖥️ Backend Setup (Flask)

## 1️⃣ Navigate to backend folder

```bash
cd backend
```

## 2️⃣ Create virtual environment

### Windows
```bash
python -m venv venv
```

### Linux / macOS
```bash
python3 -m venv venv
```

---

## 3️⃣ Activate virtual environment

### Windows
```bash
venv\Scripts\activate
```

### Linux / macOS
```bash
source venv/bin/activate
```

---

## 4️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

---

## 5️⃣ Run Flask server

```bash
python app.py
```

Backend will start on:

```bash
http://localhost:5000
```

---

# 🎨 Frontend Setup (React)

## 1️⃣ Open a new terminal

```bash
cd frontend
```

---

## 2️⃣ Install npm packages

```bash
npm install
```

---

## 3️⃣ Start React application

```bash
npm start
```

Frontend will run on:

```bash
http://localhost:3000
```

---

# 🗄️ Database Setup

The project uses SQLite by default.

Database file:

```bash
backend/database/app.db
```

No additional database installation is required.

---

# ✅ Ready to Use

Once both servers are running:

- Frontend → `http://localhost:3000`
- Backend → `http://localhost:5000`

You can now:

✅ Install mini apps  
✅ Open applications  
✅ Manage utilities  
✅ Play mini games  
✅ Test the full platform
