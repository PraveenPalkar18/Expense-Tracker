const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');


// protect middleware
function ensureApiAuth(req, res, next) {
if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
next();
}


// get all expenses for current user
router.get('/', ensureApiAuth, async (req, res) => {
const userId = req.session.user.id;
const expenses = await Expense.find({ user: userId }).sort({ date: -1 }).limit(1000);
res.json(expenses);
});


// summary for charts (by category and monthly)
router.get('/summary', ensureApiAuth, async (req, res) => {
const userId = req.session.user.id;
const expenses = await Expense.find({ user: userId });
const byCategory = {};
const byMonth = {};
expenses.forEach(e => {
byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
const k = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`;
byMonth[k] = (byMonth[k] || 0) + e.amount;
});
res.json({ byCategory, byMonth });
});


// add expense
router.post('/', ensureApiAuth, async (req, res) => {
try {
const user = req.session.user.id;
const { title, amount, category, date, notes } = req.body;
const e = await Expense.create({ user, title, amount: parseFloat(amount), category, date: date ? new Date(date) : new Date(), notes });
res.json(e);
} catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});


// delete expense
router.delete('/:id', ensureApiAuth, async (req, res) => {
try {
await Expense.deleteOne({ _id: req.params.id, user: req.session.user.id });
res.json({ ok: true });
} catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;