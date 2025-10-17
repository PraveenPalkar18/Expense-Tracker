// server.js — main entry
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');


dotenv.config();
const app = express();


// Connect DB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
secret: process.env.SESSION_SECRET || 'secret',
resave: false,
saveUninitialized: false,
store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));


// Make user available in req for APIs
app.use((req, res, next) => {
req.currentUser = req.session.user || null;
next();
});


// Routes
app.use('/', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));


// Protected page routes (serve static HTML but only if authenticated)
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


// fallback
app.get('/', (req, res) => res.redirect('/login'));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));