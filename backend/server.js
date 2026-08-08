import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import adminRouter from './routes/adminRoute.js';

const app = express();
const PORT = process.env.PORT || 4000;

connectDB();

app.use(express.json());
app.use(cors({
    origin: [
      "https://prescripto-frontend-q628.onrender.com",
      "https://prescripto-admin-ymdq.onrender.com"
    ],
    credentials: true
  })

);

app.use('/api/user', userRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => res.send('Prescripto API is running'));

// Global error handler
app.use((err, req, res, next) => {
  if (err.message === 'Unsupported image format') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image size must not exceed 5 MB' });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
