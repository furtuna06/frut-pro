import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Send, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

// ... ከ App ፋንክሽን በላይ ...
const constructionImages = [
  'https://picsum.photos/seed/b1/1920/1080',
  'https://picsum.photos/seed/b2/1920/1080',
  'https://picsum.photos/seed/b3/1920/1080',
  'https://picsum.photos/seed/b5/1920/1080',
];

function App() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lang, setLang] = useState('en');
  const [showPaymentDashboard, setShowPaymentDashboard] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', message: '' });

  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderData, setOrderData] = useState({ customerName: '', phoneNumber: '', product: '', quantity: '' });
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [costData, setCostData] = useState<any>({ clientName: '', phoneNumber: '', email: '', serviceType: 'Structural Design Review', planFile: null });
  const [selectedService, setSelectedService] = useState('Structural Design Review');
  const [calculations, setCalculations] = useState<any[]>([]);

  const navigate = useNavigate();

  const i18n: any = {
    en: {
      admin: 'Admin Dashboard',
      customerRequests: 'Customer Requests',
      serviceRequests: 'Your Service Requests',
      uploadPlans: 'Upload Your Building Plans',
      submit: 'Submit for Cost Calculation',
      delete: 'Delete',
      deleteAll: 'Delete All',
      orders: 'Orders',
      products: 'Product List',
      costCalculations: 'Cost Calculations',
      language: 'Language',
      noRecords: 'No records available',
      dateTime: 'Date & Time',
      confirmDelete: 'Are you sure?'
    },
    am: {
      admin: 'የአስተዳደር ዳሽቦርድ',
      customerRequests: 'የደንበኞች ጥያቄዎች',
      serviceRequests: 'የአገልግሎት ጥያቄዎችዎ',
      uploadPlans: 'የሕንጻ እቅድዎን ያስገቡ',
      submit: 'ለዋጋ እቅድ ይላክ',
      delete: 'አጥፋ',
      deleteAll: 'ሁሉንም ያጥፉ',
      orders: 'ትእዛዞች',
      products: 'የእቃ ዝርዝር',
      costCalculations: 'የወጪ ስሌት',
      language: 'ቋንቋ',
      noRecords: 'መዝገቦች የሉም',
      dateTime: 'ቀን እና ሰዓት',
      confirmDelete: 'እርግጠኛ ነህ?'
    }
  };

  const t = (key: string) => i18n[lang][key] || key;

  const fetchData = async () => {
    try {
      const resI = await axios.get('/api/inquiries');
      const resP = await axios.get('/api/products');
      const resO = await axios.get('/api/orders');
      const resC = await axios.get('/api/cost-calculations');

      setInquiries(resI.data);
      setProducts(resP.data);
      setOrders(resO.data);
      setCalculations(resC.data);
      console.log("ዳታው በሰላም መጥቷል! ✅");
    } catch (err) {
      console.error("ዳታ ለማምጣት አልተቻለም (404/500):", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % constructionImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [currentImageIndex]);

  const sendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, phoneNumber, message } = formData;
    if (!fullName?.trim() || !phoneNumber?.trim() || !message?.trim()) {
      alert('እባኮትን ሁሉንም መረጃ ይሙሉ።');
      return;
    }
    try {
      const res = await axios.post('/api/inquiries', formData);
      if (res.status === 201) {
        alert(res.data?.message || 'መረጃዎ ተልኳል! ✅');
        setFormData({ fullName: '', phoneNumber: '', message: '' });
        fetchData();
        return;
      }
      const fallback = res.data?.error || res.data?.message || `Unexpected status ${res.status}`;
      alert(`Error submitting inquiry: ${fallback}`);
    } catch (err: any) {
      console.error('Inquiry submission failed:', err);
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Error submitting inquiry: ${serverMessage}`);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) {
      alert("Please enter a valid product name and positive numeric price.");
      return;
    }
    try {
      const res = await axios.post('/api/products', newProduct);
      alert(res.data.message);
      setNewProduct({ name: '', price: '' });
      fetchData();
    } catch (err) {
      console.error("መመዝገብ አልተቻለም:", err);
      alert("Error adding product. Please try again.");
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData.customerName || !orderData.product || !orderData.quantity || isNaN(Number(orderData.quantity)) || Number(orderData.quantity) < 1) {
      alert('Fill ስም/እቃ/ብዛት correctly');
      return;
    }
    try {
      const res = await axios.post('/api/orders', {
        customerName: orderData.customerName,
        phoneNumber: orderData.phoneNumber,
        product: orderData.product,
        quantity: Number(orderData.quantity),
      });
      alert(res.data.message || 'Order placed successfully!');
      setOrderData({ customerName: '', phoneNumber: '', product: '', quantity: '' });
      fetchData();
    } catch (err: any) {
      console.error('Order creation failed:', err);
      const message = err.response?.data?.error || err.response?.data?.message || err.message || JSON.stringify(err);
      alert(message);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await axios.put(`/api/orders/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error('Order status update failed:', err);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await axios.delete(`/api/orders/${id}`);
      fetchData();
    } catch (err) {
      console.error('Order delete failed:', err);
    }
  };

  const deleteAllOrders = async () => {
    if (orders.length === 0) {
      alert('No orders to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${orders.length} orders?`)) return;
    try {
      await Promise.all(orders.map((order) => axios.delete(`/api/orders/${order._id}`)));
      fetchData();
    } catch (err) {
      console.error('Delete all orders failed:', err);
      alert('Failed to delete all orders.');
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm("ይህ እቃ እንዲጠፋ እርግጠኛ ነህ?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchData();
      } catch (err) {
        console.error("መሰረዝ አልተቻለም:", err);
      }
    }
  };

  const deleteAllProducts = async () => {
    if (products.length === 0) {
      alert('No products to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${products.length} products?`)) return;
    try {
      await Promise.all(products.map((product) => axios.delete(`/api/products/${product._id}`)));
      fetchData();
    } catch (err) {
      console.error('Delete all products failed:', err);
      alert('Failed to delete all products.');
    }
  };

  const UpdatePrice = async (id: string) => {
    const newPrice = prompt("አዲሱን ዋጋ ያስገቡ:");
    if (newPrice) {
      try {
        await axios.put(`/api/products/${id}`, { price: newPrice });
        fetchData();
      } catch (err) {
        console.error("ማስተካከል አልተቻለም:", err);
      }
    }
  };

  const submitCostCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('clientName', costData.clientName);
    formData.append('phoneNumber', costData.phoneNumber);
    formData.append('email', costData.email);
    formData.append('serviceType', costData.serviceType || 'Standard');
    if (costData.planFile) {
      formData.append('planFile', costData.planFile);
    }
    try {
      const res = await axios.post('/api/cost-calculations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setCostData({ clientName: '', phoneNumber: '', email: '', planFile: null });
      fetchData();
    } catch (err) {
      console.error('Cost calculation submission failed:', err);
      alert('Error submitting cost calculation');
    }
  };

  const handleEstimateUpload = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('estimateFile', file);
    try {
      await axios.put(`/api/cost-calculations/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Estimate uploaded and sent to customer successfully!');
      fetchData();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    }
  };

  const completeCalculation = async (id: string) => {
    try {
      await axios.put(`/api/cost-calculations/${id}`, { status: 'completed' });
      alert('Request marked complete and customer notified.');
      fetchData();
    } catch (err) {
      console.error('Complete update failed:', err);
      alert('Could not mark complete');
    }
  };

  const deleteInquiry = async (id: string) => {
    if (window.confirm("ይህ መልእክት እንዲጠፋ እርግጠኛ ነህ?")) {
      try {
        await axios.delete(`/api/inquiries/${id}`);
        fetchData();
      } catch (err) {
        console.error("መሰረዝ አልተቻለም:", err);
      }
    }
  };

  const deleteAllInquiries = async () => {
    if (inquiries.length === 0) {
      alert('No inquiries to delete.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete all ${inquiries.length} inquiries?`)) {
      try {
        await Promise.all(inquiries.map((iq) => axios.delete(`/api/inquiries/${iq._id}`)));
        fetchData();
      } catch (err) {
        console.error('Delete all inquiries failed:', err);
        alert('Failed to delete all inquiries.');
      }
    }
  };

  const deleteCalculation = async (id: string) => {
    if (!window.confirm('Delete this cost calculation?')) return;
    try {
      await axios.delete(`/api/cost-calculations/${id}`);
      fetchData();
    } catch (err) {
      console.error('Cost calculation delete failed:', err);
      alert('Failed to delete this cost calculation.');
    }
  };

  const deleteAllCalculations = async () => {
    if (calculations.length === 0) {
      alert('No cost calculations to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${calculations.length} cost calculations?`)) return;
    try {
      await axios.delete('/api/cost-calculations');
      fetchData();
    } catch (err) {
      console.error('Delete all cost calculations failed:', err);
      alert('Failed to delete all cost calculations.');
    }
  };

  const [adminPassword] = useState('1234');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === adminPassword) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginInput('');
      alert('እንኳን ደህና መጡ, Admin!');
    } else {
      alert('የተሳሳተ የይለፍ ቃል።');
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      {/* --- የላይኛው ባር (NAVBAR) --- */}
      <nav style={{
        background: '#0c0e22',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setActiveSection('home')}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: '35px', fontWeight: '900', color: '#FF9800', letterSpacing: '-1px' }}>Y</span>
            <span style={{ fontSize: '35px', fontWeight: '900', color: '#FF9800', position: 'relative', display: 'inline-block' }}>
              A
              <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderBottom: '8px solid #FF9800' }}></div>
            </span>
            <span style={{ fontSize: '35px', fontWeight: '900', color: '#FF9800' }}>RED</span>
          </div>
          <span style={{ fontSize: '11px', color: '#FFFFFF', letterSpacing: '4px', fontWeight: '300', marginTop: '-5px', textTransform: 'uppercase' }}>
            Construction Solutions
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: '0 8px 0 0', fontWeight: '700', color: 'white' }}>{t('language')}:</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '6px 10px', borderRadius: '5px', border: 'none', fontWeight: 'bold' }}>
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>
          {isAdmin ? (
            <button
              onClick={() => setIsAdmin(false)}
              style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', fontWeight: 'bold', background: '#f44336', color: 'white' }}
            >
              ውጣ (Logout)
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setActiveSection('home')}
                  style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => setActiveSection('order')}
                  style={{ background: '#ff9800', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  📦 Order
                </button>
                <button
                  onClick={() => setActiveSection('cart')}
                  style={{ background: '#4caf50', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🛒 Cart
                </button>
                <button
                  onClick={() => setShowPaymentDashboard(true)}
                  style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', fontWeight: 'bold', background: '#28a745', color: 'white' }}
                >
                  Payment
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: 'none', fontWeight: 'bold', background: '#ff9800', color: '#0d47a1' }}
                >
                  Admin Login 🔐
                </button>
              </div>
              {showLoginModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    <h3 style={{ color: '#0c0e22', marginBottom: '20px' }}>Admin Login</h3>
                    <form onSubmit={handleLogin}>
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowLoginModal(false)}
                          style={{ flex: 1, padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          Login
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {showPaymentDashboard && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'white', zIndex: 2000, padding: '20px', overflowY: 'auto'
                }}>
                  <button
                    onClick={() => setShowPaymentDashboard(false)}
                    style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    X Back
                  </button>
                  <h2 style={{ textAlign: 'center', color: '#01579b', marginTop: '20px' }}>የክፍያ አማራጮች (Payment Dashboard)</h2>
                  <div style={{ maxWidth: '600px', margin: '30px auto', display: 'grid', gap: '20px' }}>
                    <div style={{ border: '2px solid #1f1b1b', padding: '20px', borderRadius: '15px', background: '#f9f9f9' }}>
                      <h3 style={{ color: '#2e7d32' }}>🏦 በባንክ ይክፈሉ (Bank Transfer)</h3>
                      <p><strong>CBE (ንግድ ባንክ):</strong> 1000123456789</p>
                      <p><strong>Abyssinia (አቢሲኒያ):</strong> 987654321</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>* ክፍያውን ከፈጸሙ በኋላ ደረሰኙን በቴሌግራም ይላኩልን።</p>
                    </div>
                    <div style={{ border: '2px solid #131010', padding: '20px', borderRadius: '15px', background: '#f9f9f9', textAlign: 'center' }}>
                      <h3 style={{ color: '#0c0e22' }}>💳 በ Chapa / Telebirr</h3>
                      <p>ቀጥታ በካርድ ወይም በቴሌብር ለመክፈል ከታች ያለውን ይጫኑ</p>
                      <button
                        onClick={() => window.location.href = 'https://checkout.chapa.co/checkout/web/payment/PL-zBwRqZkFRvGv'}
                        style={{ width: '100%', padding: '15px', background: '#5d3fd3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        አሁኑኑ ይክፈሉ (Pay Now)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {activeSection === 'home' && !isAdmin && (
        <div style={{ position: 'relative', width: '100%', height: '450px', overflow: 'hidden', borderRadius: '0 0 20px 20px' }}>
          <img
            key={currentImageIndex}
            src={constructionImages[currentImageIndex]}
            alt="Construction"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease-in-out' }}
          />
          <div style={{ position: 'absolute', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', transform: 'translateY(-50%)' }}>
            <button style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '50%' }} onClick={() => setCurrentImageIndex((prev) => (prev - 1 + constructionImages.length) % constructionImages.length)}>❮</button>
            <button style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '50%' }} onClick={() => setCurrentImageIndex((prev) => (prev + 1) % constructionImages.length)}>❯</button>
          </div>
        </div>
      )}

      {activeSection === 'order' && !isAdmin && (
        <div style={{ padding: '60px 20px', background: '#f0f2f5', minHeight: '80vh' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveSection('home')}
              style={{ marginBottom: '30px', padding: '12px 24px', cursor: 'pointer', background: '#fff', color: '#004a99', border: '1px solid #004a99', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            >
              ← ወደ ኋላ ተመለስ (Back to Home)
            </motion.button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
              {/* Upload Plans Card */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ padding: '40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', borderTop: '8px solid #004a99' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📐</div>
                  <h2 style={{ color: '#004a99', fontSize: '1.8rem', margin: 0 }}>Upload Building Plans</h2>
                  <p style={{ color: '#666' }}>ለዋጋ ስሌት እና ለዲዛይን ክለሳ ፕላንዎን እዚህ ያስገቡ</p>
                </div>
                
                <form onSubmit={submitCostCalculation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ሙሉ ስም (Full Name)</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={costData.clientName}
                      onChange={(e) => setCostData({ ...costData, clientName: e.target.value })}
                      required
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ስልክ ቁጥር (Phone Number)</label>
                    <input
                      type="tel"
                      placeholder="e.g. +251 9..."
                      value={costData.phoneNumber}
                      onChange={(e) => setCostData({ ...costData, phoneNumber: e.target.value })}
                      required
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ኢሜል (Email Address)</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={costData.email}
                      onChange={(e) => setCostData({ ...costData, email: e.target.value })}
                      required
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>የተመረጠ አገልግሎት (Selected Service)</label>
                    <input
                      type="text"
                      value={selectedService}
                      readOnly
                      style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', color: '#555', background: '#f8f9fa', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ፕላን ይምረጡ (Select Plan File)</label>
                    <input
                      type="file"
                      accept=".pdf,.dwg,.jpg,.png"
                      onChange={(e: any) => setCostData({ ...costData, planFile: e.target.files?.[0] })}
                      required
                      style={{ padding: '12px', border: '2px dashed #004a99', borderRadius: '10px', background: '#f0f7ff' }}
                    />
                    <small style={{ color: '#666' }}>Supported: PDF, DWG, JPG, PNG</small>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    style={{ padding: '18px', background: '#004a99', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px', boxShadow: '0 8px 20px rgba(0,74,153,0.3)' }}
                  >
                    Submit for Calculation
                  </motion.button>
                </form>
              </motion.section>

              {/* Place Order Card */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ padding: '40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', borderTop: '8px solid #28a745' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
                  <h2 style={{ color: '#28a745', fontSize: '1.8rem', margin: 0 }}>Place Order</h2>
                  <p style={{ color: '#666' }}>Order construction materials directly here</p>
                </div>

                <form onSubmit={placeOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ስም (Name)</label>
                    <input 
                      required 
                      placeholder="Enter your name" 
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }} 
                      value={orderData.customerName} 
                      onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })} 
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ስልክ (Phone)</label>
                    <input 
                      placeholder="e.g. +251 9..." 
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }} 
                      value={orderData.phoneNumber} 
                      onChange={(e) => setOrderData({ ...orderData, phoneNumber: e.target.value })} 
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>የሚፈልጉት እቃ (Product)</label>
                    <input 
                      required 
                      placeholder="e.g. Cement, Sand, Steel..." 
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }} 
                      value={orderData.product} 
                      onChange={(e) => setOrderData({ ...orderData, product: e.target.value })} 
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>ብዛት (Quantity)</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      placeholder="Enter quantity" 
                      style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '1rem' }} 
                      value={orderData.quantity} 
                      onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })} 
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    style={{ padding: '18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px', boxShadow: '0 8px 20px rgba(40,167,69,0.3)' }}
                  >
                    Submit Order
                  </motion.button>
                </form>
              </motion.section>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'cart' && !isAdmin && (
        <div style={{ padding: '60px 20px', background: '#f0f2f5', minHeight: '80vh' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveSection('home')}
              style={{ marginBottom: '30px', padding: '12px 24px', cursor: 'pointer', background: '#fff', color: '#004a99', border: '1px solid #004a99', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            >
              ← ወደ ኋላ ተመለስ (Back to Home)
            </motion.button>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '40px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <div style={{ fontSize: '2.5rem' }}>📋</div>
                <div>
                  <h3 style={{ color: '#004a99', fontSize: '1.8rem', margin: 0 }}>{t('serviceRequests')}</h3>
                  <p style={{ color: '#666', margin: 0 }}>የጠየቋቸው አገልግሎቶች እና የዋጋ ስሌቶች ዝርዝር</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderRadius: '10px 0 0 10px', color: '#004a99' }}>Service Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#004a99' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#004a99' }}>Plan File</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderRadius: '0 10px 10px 0', color: '#004a99' }}>Estimate Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
                          <p>{t('noRecords')}</p>
                        </td>
                      </tr>
                    ) : (
                      calculations.map((calc) => (
                        <motion.tr 
                          key={calc._id} 
                          whileHover={{ scale: 1.01, backgroundColor: '#fcfcfc' }}
                          style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '10px' }}
                        >
                          <td style={{ padding: '20px', fontWeight: 'bold', color: '#333', borderRadius: '10px 0 0 10px' }}>{calc.serviceType}</td>
                          <td style={{ padding: '20px' }}>
                            <span style={{ 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem', 
                              fontWeight: 'bold',
                              background: calc.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                              color: calc.status === 'completed' ? '#2e7d32' : '#ef6c00'
                            }}>
                              {calc.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '20px' }}>
                            <a href={`/uploads/${calc.planFile}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              📄 View Plan
                            </a>
                          </td>
                          <td style={{ padding: '20px', borderRadius: '0 10px 10px 0' }}>
                            {calc.estimateFile ? (
                              <a href={`/uploads/${calc.estimateFile}`} target="_blank" rel="noopener noreferrer" style={{ background: '#004a99', color: 'white', padding: '8px 15px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                ⬇️ Download Estimate
                              </a>
                            ) : (
                              <span style={{ color: '#999', fontStyle: 'italic' }}>Processing...</span>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </div>
        </div>
      )}

      <div style={{ paddingBottom: '60px' }}>
        {isAdmin ? (
          <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fa' }}>
            {/* Admin Sidebar */}
            <div style={{ width: '280px', background: '#0c0e22', color: 'white', padding: '30px 20px', position: 'sticky', top: 0, height: '100vh' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏗️</div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>YARED ADMIN</h2>
                <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Control Panel</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ padding: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: 'white', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' }}>📊 Dashboard Overview</button>
                <button onClick={() => setIsAdmin(false)} style={{ padding: '15px', background: '#f44336', border: 'none', borderRadius: '10px', color: 'white', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' }}>🚪 Logout</button>
              </div>
            </div>

            {/* Admin Content */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ margin: 0, color: '#0c0e22' }}>{t('admin')} Dashboard</h1>
                <div style={{ background: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontWeight: 'bold', color: '#004a99' }}>
                  Welcome, Admin 👋
                </div>
              </header>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {[
                  { label: 'Total Products', val: products.length, color: '#007bff', icon: '📦' },
                  { label: 'Active Orders', val: orders.length, color: '#28a745', icon: '🛒' },
                  { label: 'Calculations', val: calculations.length, color: '#ffc107', icon: '📐' },
                  { label: 'Inquiries', val: inquiries.length, color: '#17a2b8', icon: '✉️' }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', borderLeft: `6px solid ${stat.color}` }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{stat.icon}</div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>{stat.val}</div>
                  </div>
                ))}
              </div>

              {/* Add Product Section */}
              <section style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>✨ Add New Product</h3>
                <form onSubmit={addProduct} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <input placeholder="Product Name (e.g. Cement)" style={{ flex: 2, padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} value={newProduct.name || ''} />
                  <input placeholder="Price (ETB)" style={{ flex: 1, padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} value={newProduct.price || ''} />
                  <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Add Product</button>
                </form>
              </section>

              {/* Products Table */}
              <section style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>📦 Inventory Management</h3>
                  <button onClick={deleteAllProducts} disabled={products.length === 0} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Delete All ({products.length})
                  </button>
                </div>
                <input type="text" placeholder="Search products..." style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd' }} onChange={(e) => setSearchTerm(e.target.value)} />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Product Name</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Price</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                        <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px', fontWeight: 'bold' }}>{product.name}</td>
                          <td style={{ padding: '15px' }}>{product.price} ETB</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button onClick={() => UpdatePrice(product._id)} style={{ marginRight: '10px', background: '#ffc107', color: 'black', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => deleteProduct(product._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Orders Table */}
              <section style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>🛒 Customer Orders</h3>
                  <button onClick={deleteAllOrders} disabled={orders.length === 0} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Clear All ({orders.length})
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 'bold' }}>{order.customerName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.phoneNumber}</div>
                          </td>
                          <td style={{ padding: '15px' }}>{order.product}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>{order.quantity}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: '#e3f2fd', color: '#1976d2' }}>{order.status}</span>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button onClick={() => updateOrderStatus(order._id, 'confirmed')} style={{ marginRight: '5px', background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Confirm</button>
                            <button onClick={() => deleteOrder(order._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Calculations Table */}
              <section style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>📐 Cost Calculations</h3>
                  <button onClick={deleteAllCalculations} disabled={calculations.length === 0} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Clear All ({calculations.length})
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Client</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Service</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.map(calc => (
                        <tr key={calc._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 'bold' }}>{calc.clientName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{calc.phoneNumber}</div>
                          </td>
                          <td style={{ padding: '15px' }}>{calc.serviceType}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: calc.status === 'completed' ? '#e8f5e9' : '#fff3e0', color: calc.status === 'completed' ? '#2e7d32' : '#ef6c00' }}>{calc.status}</span>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            {calc.status !== 'completed' && (
                              <label style={{ background: '#007bff', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                ⬆️ Upload Result
                                <input type="file" style={{ display: 'none' }} onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleEstimateUpload(calc._id, file);
                                }} />
                              </label>
                            )}
                            <button onClick={() => deleteCalculation(calc._id)} style={{ marginLeft: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Inquiries Section */}
              <section style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>💬 Customer Inquiries</h3>
                  <button onClick={deleteAllInquiries} disabled={inquiries.length === 0} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Clear All ({inquiries.length})
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                        <th style={{ padding: '15px', textAlign: 'left' }}>Message</th>
                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((iq) => (
                        <tr key={iq._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px', fontWeight: 'bold' }}>{iq.fullName}</td>
                          <td style={{ padding: '15px' }}>{iq.phoneNumber}</td>
                          <td style={{ padding: '15px' }}>{iq.message}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button onClick={() => deleteInquiry(iq._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        ) : (
          activeSection === 'home' && (
            <div style={{ scrollBehavior: 'smooth', fontFamily: 'Arial, sans-serif' }}>
              <header style={{
                background: 'linear-gradient(rgba(0,40,100,0.85), rgba(0,40,100,0.85)), url("https://images.unsplash.com/photo-1503387762-592dee58c160?q=80&w=2000")',
                backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', padding: '120px 20px', textAlign: 'center'
              }}>
                <h1 style={{ fontSize: '2.8rem', marginBottom: '10px' }}>Precision in Every Calculation, Excellence in Every Build!</h1>
                <h2 style={{ fontSize: '2.2rem', color: '#ffcc00', fontWeight: 'bold' }}>ትክክለኛ ስሌት ለላቀ ግንባታ!</h2>
                <p style={{ maxWidth: '900px', margin: '25px auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
                  Your Trusted Partner in Construction Cost Management and Civil Engineering Solutions.
                  ከግምት ስራ እስከ ፕሮጀክት ርክክብ፣ ህልምዎን በኢኮኖሚያዊ ስሌት እና በፅኑ ምህንድስና እውን እናደርጋለን።
                </p>
              </header>

              <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.h2
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  style={{ textAlign: 'center', color: '#004a99', fontSize: '2.5rem', marginBottom: '40px' }}
                >
                  OUR SERVICES / አገልግሎቶቻችን
                </motion.h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                  {[
                    { t: "Detailed BOQ Preparation", d: "ትክክለኛ የቁሳቁስ ዝርዝር እና የዋጋ ግምት ማዘጋጀት" },
                    { t: "Rate Analysis", d: "ወቅታዊ የገበያ ዋጋ ትንተና" },
                    { t: "Material Wastage Audit", d: "በሳይት ላይ የሚባክኑ ብረቶች፣ ኮንክሪት እና ሴራሚክስ ቁጥጥር" },
                    { t: "Payment Certificates", d: "የክፍያ ሰርተፍኬት ዝግጅት" },
                    { t: "Structural Design Review", d: "የስትራክቸር ዲዛይን ክለሳ" },
                    { t: "Bar Bending Schedule (BBS)", d: "የብረት ዝርዝር አወጣጥ - BBS" },
                    { t: "Site Supervision", d: "የሳይት ቁጥጥር እና ጥራት ማረጋገጥ" },
                    { t: "Technical Reporting", d: "ወቅታዊ የምህንድስና ሪፖርቶች" }
                  ].map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 80, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 12,
                        delay: index * 0.1 
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -10,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                      style={{ padding: '30px', borderRadius: '15px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderTop: '6px solid #004a99', cursor: 'pointer' }}
                    >
                      <h3 style={{ color: '#004a99', marginBottom: '15px' }}>{service.t}</h3>
                      <p style={{ color: '#555', lineHeight: '1.5' }}>{service.d}</p>
                      <button
                        onClick={() => {
                          setSelectedService(service.t);
                          setCostData({ ...costData, serviceType: service.t });
                          setActiveSection('order');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{ marginTop: '10px', background: '#007bff', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Order {service.t}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section style={{ background: '#004a99', color: 'white', padding: '80px 20px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '50px' }}>
                  <div>
                    <h2 style={{ color: '#ffcc00' }}>ABOUT US / ስለ እኛ</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                      <strong>YARED ENGINEERING SOLUTIONS</strong> is a premier consultancy firm based in Ethiopia, specializing in the intersection of Civil Engineering and Quantity Surveying. Founded by Mr. Yared Assefa, we bridge the gap between architectural vision and financial reality.
                    </p>
                  </div>
                  <div>
                    <h2 style={{ color: '#ffcc00' }}>WHY CHOOSE US? / ለምን እኛን?</h2>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem', lineHeight: '2.5' }}>
                      <li>✅ Industry Expertise (የዳበረ ልምድ)</li>
                      <li>✅ Zero-Waste Policy (ብክነትን መቀነስ)</li>
                      <li>✅ Professional Integrity (ግልፅነት)</li>
                      <li>✅ Dual Competence (ምህንድስና + ወጪ)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
                <h2 style={{ color: '#333', marginBottom: '20px' }}>📍 አድራሻችን</h2>
                <div style={{ width: '100%', overflow: 'hidden', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <iframe
                    title="Yared Construction Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15762.656515124!2d38.7500!3d9.0300!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85cef5ab402d%3A0x8467b6b037a24c49!2sAddis%20Ababa!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade">
                  </iframe>
                </div>
                <div style={{ marginTop: '20px', fontSize: '1.1rem', color: '#555' }}>
                  <p>🏢 አድራሻ፡ አዲስ አበባ፣ ኢትዮጵያ</p>
                  <p>📞 ስልክ፡ +251 977 49 26 96</p>
                </div>
              </div>

              
            </div>
          )
        )}

        {!isAdmin && (
          <>
            <section style={{ padding: '80px 20px', textAlign: 'center' }}>
              <h2 style={{ color: '#004a99', fontSize: '2.2rem' }}>Contact Us / ያግኙን</h2>
              <div style={{ margin: '30px 0', fontSize: '1.2rem', color: '#333' }}>
                <p>📍 Addis Ababa, Ethiopia</p>
                <p>📞 +251 977 49 26 96</p>
                <p>📧 Yaredengineeringsolutions@gmail.com</p>
              </div>
              <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f9f9f9', padding: '40px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <form onSubmit={sendInquiry}>
                  <input required placeholder="ሙሉ ስም" style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} value={formData.fullName} />
                  <input required placeholder="ስልክ ቁጥር" style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} value={formData.phoneNumber} />
                  <textarea required placeholder="የእርስዎ መልዕክት..." style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', height: '120px' }} onChange={(e) => setFormData({ ...formData, message: e.target.value })} value={formData.message}></textarea>
                  <button type="submit" style={{ width: '100%', padding: '18px', background: '#004a99', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>መልዕክቱን ላክ</button>
                </form>
              </div>
            </section>

            <footer style={{ backgroundColor: '#222', color: 'white', padding: '40px 20px', textAlign: 'center', marginTop: '50px' }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>© 2026 YARED Construction Materials. All rights reserved.</p>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '25px' }}>
                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', transition: 'transform 0.3s' }} title="Facebook">
                  <Facebook size={28} />
                </a>
                <a href="https://t.me/+251977492696" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', transition: 'transform 0.3s' }} title="Telegram">
                  <Send size={28} />
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', transition: 'transform 0.3s' }} title="Instagram">
                  <Instagram size={28} />
                </a>
                <a href="https://wa.me/251977492696" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', transition: 'transform 0.3s' }} title="WhatsApp">
                  <MessageCircle size={28} />
                </a>
              </div>
              <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#aaa' }}>Contact: +251 977 49 26 96</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
