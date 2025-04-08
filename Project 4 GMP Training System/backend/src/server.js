require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/audit', require('./routes/audit'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'up', serverTime: new Date().toISOString() }, message: 'OK' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`GMP Training API running on port ${PORT}`));
