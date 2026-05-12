import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import net from 'net';
import axios from 'axios';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors()); // Enable CORS for all routes
const defaultPort = 3000;

const portArgFromProcess = (() => {
  const portArgIndex = process.argv.findIndex(arg => arg === '--port' || arg.startsWith('--port='));
  if (portArgIndex === -1) return undefined;
  const portArg = process.argv[portArgIndex];
  return portArg.includes('=') ? portArg.split('=')[1] : process.argv[portArgIndex + 1];
})();

const portArgFromNpm = (() => {
  if (process.env.npm_config_port) {
    return process.env.npm_config_port;
  }
  if (!process.env.npm_config_argv) return undefined;
  try {
    const npmArgv = JSON.parse(process.env.npm_config_argv) as { original?: string[] };
    const original = npmArgv.original || [];
    const inlineArg = original.find(arg => arg.startsWith('--port='));
    if (inlineArg) return inlineArg.split('=')[1];
    const idx = original.findIndex(arg => arg === '--port');
    if (idx !== -1 && original[idx + 1]) return original[idx + 1];
  } catch {
    // ignore malformed npm config argv
  }
  return undefined;
})();

const desiredPort = Number(process.env.PORT || portArgFromProcess || portArgFromNpm || defaultPort);
if (Number.isNaN(desiredPort) || desiredPort <= 0) {
  throw new Error(`Invalid port specified: ${process.env.PORT || portArgFromProcess || portArgFromNpm}`);
}

const findAvailablePort = async (startPort: number, maxAttempts = 20): Promise<number> => {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    const isFree = await new Promise<boolean>(resolve => {
      const tester = net.createServer()
        .once('error', err => {
          if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
            resolve(false);
          } else {
            resolve(false);
          }
        })
        .once('listening', () => {
          tester.close(() => resolve(true));
        })
        .listen(port, '0.0.0.0');
    });
    if (isFree) return port;
  }
  throw new Error(`No available port found starting at ${startPort}`);
};

let PORT = desiredPort;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected! ✅'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- MONGOOSE SCHEMAS ---
const inquirySchema = new mongoose.Schema({
  fullName: String,
  phoneNumber: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', inquirySchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: String
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  customerName: String,
  phoneNumber: String,
  product: String,
  quantity: Number,
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

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
const CostCalculation = mongoose.model('CostCalculation', costCalculationSchema);

const paymentSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  amount: Number,
  tx_ref: String,
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});
const Payment = mongoose.model('Payment', paymentSchema);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- TELEGRAM & EMAIL CONFIG ---
const TELEGRAM_TOKEN = '8541210751:AAEWbQsQYSfD4_OhKPQzaX6ccWzq6zBQSqs';
const CHAT_ID = '5983528814';

const sendTelegram = async (orderData: any) => {
  const message = `🔔 አዲስ ትዕዛዝ ተለያል ቦታዊ!\n\n👤 ስም: ${orderData.customerName || orderData.clientName}\n📞 ስፖት: ${orderData.phoneNumber}\n🛠️ አገልግሎት: ${orderData.serviceType || orderData.product || 'Unknown'}\n📄 ፋይል: ${orderData.planFileName || orderData.planFile || 'N/A'}`;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message
    });
  } catch (err) {
    console.error("Telegram error:", err);
  }
};

const sendEmail = async (orderData: any, isCustomerNotification = false, attachmentPath: string | null = null) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hagezomfurtuna@gmail.com',
      pass: 'adki kdwx quqc uqro' // የጊሜል አፕ ፓስወርድ App Password
    }
  });

  let mailOptions: any = {};

  if (isCustomerNotification && attachmentPath) {
    // Send completed work to customer
    mailOptions = {
      from: 'hagezomfurtuna@gmail.com',
      to: orderData.email, // Send to customer
      subject: `Your ${orderData.serviceType} is Complete`,
      text: `Dear ${orderData.customerName || orderData.clientName},\n\nYour ${orderData.serviceType} has been completed. Please find the completed work attached.\n\nThank you for choosing Yared Engineering Solutions!\n\nBest regards,\nYared Engineering Solutions Team`,
      attachments: [
        {
          filename: `completed_${(orderData.serviceType || 'work').replace(/\s+/g, '_')}.pdf`,
          path: attachmentPath
        }
      ]
    };
  } else {
    // Send notification to admin
    mailOptions = {
      from: 'hagezomfurtuna@gmail.com',
      to: 'hagezomfurtuna@gmail.com', // ለፅሁፍ የራሱ ኢሜል
      subject: `New service request: ${orderData.serviceType || orderData.product || 'Unknown Service'}`,
      text: `New service request details:\n\nCustomer Name: ${orderData.customerName || orderData.clientName || 'N/A'}\nPhone: ${orderData.phoneNumber || 'N/A'}\nEmail: ${orderData.email || 'N/A'}\nService: ${orderData.serviceType || orderData.product || 'N/A'}\nPlan file: ${orderData.planFileName || orderData.planFile || 'N/A'}\nMessage: ${orderData.message || 'N/A'}`
    };
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Email error:", err);
  }
};

// API Routes
app.get('/api/inquiries', async (req, res) => {
  const data = await Inquiry.find().sort({ date: -1 });
  res.json(data);
});

app.post('/api/inquiries', async (req, res) => {
  const inquiry = new Inquiry(req.body);
  await inquiry.save();
  
  // Notify admin
  await sendTelegram({
    customerName: inquiry.fullName,
    phoneNumber: inquiry.phoneNumber,
    serviceType: 'Inquiry',
    message: inquiry.message
  }).catch(err => console.log("Telegram Error (Inquiry)", err));

  res.status(201).json({ message: 'ለተላለፈ ተመለሰ! ✅', inquiry });
});

app.delete('/api/inquiries/:id', async (req, res) => {
  await Inquiry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/products', async (req, res) => {
  const data = await Product.find();
  res.json(data);
});

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json({ message: 'እቃው በሰላም ተመዝግቧል!', product });
});

app.put('/api/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  if (product) {
    res.json({ message: 'Updated', product });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/orders', async (req, res) => {
  const data = await Order.find().sort({ date: -1 });
  res.json(data);
});

app.post('/api/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  
  // Notify admin
  await sendTelegram(order).catch(err => console.log("Telegram Error (Order)", err));
  await sendEmail(order).catch(err => console.log("Email Error (Order)", err));

  res.status(201).json({ message: 'Order placed successfully!', order });
});

app.put('/api/orders/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  if (order) {
    res.json({ message: 'Updated', order });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/cost-calculations', async (req, res) => {
  const data = await CostCalculation.find().sort({ date: -1 });
  res.json(data);
});

app.post('/api/cost-calculations', upload.single('planFile'), async (req, res) => {
  const calcData = {
    ...req.body,
    planFile: req.file ? req.file.filename : null
  };
  const calc = new CostCalculation(calcData);
  await calc.save();
  
  // Notify admin
  const telegramMsg = `🔔 አዲስ የእቃ ስብስብ ተለያል!\n\n👤 ስም: ${calc.clientName}\n📞 ስፖት: ${calc.phoneNumber}\n📧 ኢሜል: ${calc.email}\n📄 ፋይል: ${req.file ? req.file.originalname : 'N/A'}`;
  axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: telegramMsg,
    parse_mode: 'Markdown'
  }).catch(err => console.log("Telegram Send Error (Cost Calc)", err));

  res.status(201).json({ message: 'የእቃ ስብስብ ተለያል! በቅርቡ ማስተካከል እናደርጋለን። ✅', calculation: calc });
});

app.put('/api/cost-calculations/:id', upload.single('estimateFile'), async (req, res) => {
  const update: any = { ...req.body, status: 'completed' };
  if (req.file) {
    update.estimateFile = req.file.filename;
  }
  
  const updated = await CostCalculation.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
  
  if (updated) {
    // Notify admin
    await sendTelegram(updated);
    await sendEmail(updated);

    // Notify customer
    if (updated.estimateFile) {
      const attachmentPath = path.join(uploadsDir, updated.estimateFile);
      await sendEmail(updated, true, attachmentPath);
    }

    res.json({ message: 'Updated', calculation: updated });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/cost-calculations/:id', async (req, res) => {
  await CostCalculation.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.delete('/api/cost-calculations', async (req, res) => {
  await CostCalculation.deleteMany({});
  res.json({ message: 'All cost calculations deleted' });
});

// --- CHAPA PAYMENT ROUTE ---
app.post('/api/pay', async (req, res) => {
  const { amount, firstName, email, tx_ref } = req.body;
  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: amount,
        currency: 'ETB',
        email: email,
        first_name: firstName,
        tx_ref: tx_ref,
        callback_url: 'https://webhook.site/000',
        return_url: 'http://localhost:3000/',
        customization: {
          title: 'Yared Engineering Solutions',
          description: 'Payment for Construction Materials'
        }
      },
      {
        headers: {
          Authorization: `Bearer CHASECK_TEST-3QUDKVubCWS5sPWeuFSQIa2VmppaJjpN`,
          'Content-Type': 'application/json'
        }
      }
    );

    const payment = new Payment({
      customerName: firstName,
      email: email,
      amount: amount,
      tx_ref: tx_ref,
      status: 'pending'
    });
    await payment.save();

    res.json(response.data);
  } catch (err: any) {
    console.error("Chapa Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "ክፍያ ማስጀመር አልተቻለም" });
  }
});

app.get('/api/payments', async (req, res) => {
  const data = await Payment.find().sort({ date: -1 });
  res.json(data);
});

// Vite middleware setup
async function startServer() {
  PORT = await findAvailablePort(desiredPort);
  if (PORT !== desiredPort) {
    console.warn(`Requested port ${desiredPort} was in use. Starting server on available port ${PORT} instead.`);
  }

  if (process.env.NODE_ENV !== 'production') {
    const hmrPortBase = Number(process.env.HMR_PORT || PORT + 1);
    const hmrPort = await findAvailablePort(hmrPortBase);
    if (hmrPort !== hmrPortBase) {
      console.warn(`HMR websocket port ${hmrPortBase} was in use. Using ${hmrPort} instead.`);
    }
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: hmrPort, host: 'localhost' } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`Vite HMR websocket listening on port ${hmrPort}`);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (PORT !== desiredPort) {
    console.warn(`Requested port ${desiredPort} was in use. Starting server on available port ${PORT} instead.`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Use a different port with --port <port> or set PORT=<port>.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
