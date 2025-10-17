// server.js — main entry
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config(); // Load .env file
const app = express();

// ====== MongoDB Connection ======
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI;

// Debug log to verify .env is loading
console.log("🧩 MONGO_URI from .env:", MONGO_URI);

if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set in environment variables");
    process.exit(1);
}

// Use async function for better error handling
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}
connectDB();

// ====== Middlewares ======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ====== Session Setup ======
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ====== Make user available in req ======
app.use((req, res, next) => {
    req.currentUser = req.session.user || null;
    next();
});

// ====== Routes ======
app.use('/', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));

// ====== Protected Pages ======
function ensureAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

app.get('/expenses/dashboard', ensureAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/expenses/history', ensureAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// ====== Fallback ======
app.get('/', (req, res) => res.redirect('/login'));

// ====== Start Server ======
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
