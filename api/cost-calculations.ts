import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

// CostCalculation Schema
let CostCalculation: any;
try {
  CostCalculation = mongoose.model('CostCalculation');
} catch {
  const costCalculationSchema = new mongoose.Schema({
    clientName: String,
    phoneNumber: String,
    email: String,
    serviceType: String,
    planFile: String,
    estimateFile: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
  });
  CostCalculation = mongoose.model('CostCalculation', costCalculationSchema);
}

// Multer setup for Vercel (use /tmp for temporary storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Vercel temporary directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const data = await CostCalculation.find().sort({ date: -1 });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // Handle file upload
      upload.single('planFile')(req, res, async (err) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        const calcData = {
          clientName: req.body.clientName,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          serviceType: req.body.serviceType,
          planFile: req.file ? req.file.filename : null,
          status: 'pending'
        };

        const calc = new CostCalculation(calcData);
        await calc.save();

        return res.status(201).json({ message: 'Cost calculation submitted successfully', calc });
      });
      return; // Don't return here, multer handles the response
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      upload.single('estimateFile')(req, res, async (err) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        const update: any = { status: req.body.status };
        if (req.file) update.estimateFile = req.file.filename;

        const updated = await CostCalculation.findByIdAndUpdate(id, update, { new: true });
        return res.status(200).json(updated);
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (req.query.id) {
        await CostCalculation.findByIdAndDelete(req.query.id);
        return res.status(200).json({ message: 'Cost calculation deleted' });
      } else {
        await CostCalculation.deleteMany({});
        return res.status(200).json({ message: 'All cost calculations deleted' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parser for multer
  },
};