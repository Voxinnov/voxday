const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const todoRoutes = require('./routes/todoRoutes');
const taskRoutes = require('./routes/taskRoutes');
const renewalRoutes = require('./routes/renewalRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const dietRoutes = require('./routes/dietRoutes');
const dayPlannerRoutes = require('./routes/dayPlannerRoutes');
const noteRoutes = require('./routes/noteRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const goalRoutes = require('./routes/goalRoutes');
const adminCategoryRoutes = require('./routes/adminCategoryRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminStatsRoutes = require('./routes/adminStatsRoutes');
const adminTransactionRoutes = require('./routes/adminTransactionRoutes');
const adminTaskRoutes = require('./routes/adminTaskRoutes');
const adminTodoRoutes = require('./routes/adminTodoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api', dietRoutes);
app.use('/api/dayplanner', dayPlannerRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/goals', goalRoutes);

// Admin routes
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/transactions', adminTransactionRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/admin/todos', adminTodoRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Smart Daybook API Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
