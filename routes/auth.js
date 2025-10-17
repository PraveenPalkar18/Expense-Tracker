const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');


// serve pages
router.get('/register', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'register.html')));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));


// register
router.post('/register', async (req, res) => {
try {
const { name, email, password } = req.body;
if (!name || !email || !password) return res.status(400).send('Missing fields');
const exists = await User.findOne({ email });
if (exists) return res.status(400).send('User already exists');
const user = new User({ name, email, password });
await user.save();
req.session.user = { id: user._id, name: user.name, email: user.email };
res.redirect('/expenses/dashboard');
} catch (err) {
console.error(err);
res.status(500).send('Server error');
}
});


// login
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) return res.status(400).send('Invalid credentials');
const ok = await user.comparePassword(password);
if (!ok) return res.status(400).send('Invalid credentials');
req.session.user = { id: user._id, name: user.name, email: user.email };
res.redirect('/expenses/dashboard');
} catch (err) {
console.error(err);
res.status(500).send('Server error');
}
});


// logout
router.post('/logout', (req, res) => {
req.session.destroy(() => res.redirect('/login'));
});


module.exports = router;