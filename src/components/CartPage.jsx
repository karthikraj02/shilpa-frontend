import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, User, Mail, Calendar, Users, MapPin, ShieldCheck, CreditCard, QrCode, CheckCircle, ArrowRight, ArrowLeft, Accessibility, UserPlus, Sparkles, Briefcase, Utensils, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('cart'); // 'cart', 'details', 'customize', 'payment', 'success'
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    travelDate: '',
    numberOfPeople: 1,
    fromCity: 'Bangalore'
  });

  const [travelers, setTravelers] = useState([
    {
      name: '',
      age: '',
      gender: 'Male',
      mobile: '',
      email: '',
      specialRequirements: {
        wheelchair: false,
        seniorAssistance: false,
        extraLuggage: false,
        mealPreference: 'No Preference'
      }
    }
  ]);

  // Customization Options
  const [customizations, setCustomizations] = useState({
    transport: 'none', // 'none', 'flight', 'train', 'bus'
    stay: 'none', // 'none', 'luxury', 'boutique', 'budget'
    food: 'none' // 'none', 'all', 'breakfast'
  });

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi'
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiPaid, setUpiPaid] = useState(false);
  const [upiTimer, setUpiTimer] = useState(15);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);

  // Fetch user if logged in to prefill
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUserProfile(res.data);
        setTravelers(prev => {
          const copy = [...prev];
          if (copy[0]) {
            copy[0].name = res.data.username || '';
            copy[0].email = res.data.email || '';
          }
          return copy;
        });
      })
      .catch(err => console.log("Guest checkout or token expired"));
    }
  }, []);

  // Timer for simulated UPI checkout
  useEffect(() => {
    let interval;
    if (step === 'payment' && paymentMethod === 'upi' && upiTimer > 0 && !upiPaid) {
      interval = setInterval(() => {
        setUpiTimer(prev => {
          if (prev <= 1) {
            setUpiPaid(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentMethod, upiTimer, upiPaid]);

  const removeItem = (idToRemove) => {
    setCart(cart.filter(item => item.id !== idToRemove));
  };

  const handleNumPeopleChange = (val) => {
    const count = Math.max(1, parseInt(val) || 1);
    setFormData(prev => ({ ...prev, numberOfPeople: count }));
    
    setTravelers(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        for (let i = copy.length; i < count; i++) {
          copy.push({
            name: '',
            age: '',
            gender: 'Male',
            mobile: '',
            email: '',
            specialRequirements: {
              wheelchair: false,
              seniorAssistance: false,
              extraLuggage: false,
              mealPreference: 'No Preference'
            }
          });
        }
      } else if (copy.length > count) {
        return copy.slice(0, count);
      }
      return copy;
    });
  };

  const updateTravelerField = (index, field, value) => {
    setTravelers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateTravelerRequirement = (index, reqKey, val) => {
    setTravelers(prev => {
      const copy = [...prev];
      const specialRequirements = { ...copy[index].specialRequirements, [reqKey]: val };
      copy[index] = { ...copy[index], specialRequirements };
      return copy;
    });
  };

  // Age calculation and pricing helpers
  const getAgeCategory = (age) => {
    const parsedAge = parseInt(age);
    if (Number.isNaN(parsedAge)) return 'Adult';
    if (parsedAge >= 12) return 'Adult';
    if (parsedAge >= 5) return 'Child';
    return 'Infant';
  };

  const getPricingMultiplier = (ageCategory) => {
    if (ageCategory === 'Adult') return 1.0;
    if (ageCategory === 'Child') return 0.5;
    return 0.0; // Infant is free
  };

  const getTravelersPriceMultiplier = () => {
    return travelers.reduce((sum, t) => sum + getPricingMultiplier(getAgeCategory(t.age)), 0);
  };

  const totalMultipliers = getTravelersPriceMultiplier();

  // Base Package Total
  const baseTotal = cart.reduce((total, item) => total + (item.price * totalMultipliers), 0);

  // Customization Cost Rates
  const getTransportRate = () => {
    if (customizations.transport === 'flight') return 5000;
    if (customizations.transport === 'train') return 1500;
    if (customizations.transport === 'bus') return 800;
    return 0;
  };

  const getStayRate = () => {
    // Custom package standard assumes 4 nights stay
    if (customizations.stay === 'luxury') return 8000 * 4;
    if (customizations.stay === 'boutique') return 4000 * 4;
    if (customizations.stay === 'budget') return 1500 * 4;
    return 0;
  };

  const getFoodRate = () => {
    // Custom package standard assumes 5 days
    if (customizations.food === 'all') return 1500 * 5;
    if (customizations.food === 'breakfast') return 400 * 5;
    return 0;
  };

  const transportTotal = getTransportRate() * totalMultipliers * cart.length;
  const stayTotal = getStayRate() * cart.length;
  const foodTotal = getFoodRate() * totalMultipliers * cart.length;
  const grandTotal = baseTotal + transportTotal + stayTotal + foodTotal;

  const getTravelerType = (travs) => {
    if (!travs || travs.length === 0) return 'Solo Traveler';
    const ages = travs.map(t => parseInt(t.age) || 30);
    const hasSenior = ages.some(age => age >= 60);
    const count = travs.length;
    
    if (hasSenior) {
      return 'Senior Citizen';
    }
    if (count === 1) {
      return 'Solo Traveler';
    }
    if (count === 2) {
      return 'Couple';
    }
    // Check if any Child (5-11) or Infant (0-4) is present
    const hasChildOrInfant = travs.some(t => {
      const age = parseInt(t.age);
      return age >= 0 && age < 12;
    });
    if (hasChildOrInfant) {
      return 'Family';
    }
    return 'Group';
  };

  const getPersonalizedRecommendations = (type) => {
    switch (type) {
      case 'Solo Traveler':
        return [
          { title: 'Social Mixer Tour 👥', desc: 'Join a group of fellow solo travelers for an evening walking tour and social mixer.' },
          { title: 'Adventure Sports Upgrade 🪂', desc: 'Add bungee jumping or river rafting at a special solo discount.' }
        ];
      case 'Couple':
        return [
          { title: 'Candlelight Dinner Upgrade 🕯️', desc: 'Enjoy a romantic 3-course private beachside dinner with wine.' },
          { title: 'Couple\'s Spa & Wellness 💆', desc: 'Relax with a premium 90-minute therapeutic massage package.' }
        ];
      case 'Family':
        return [
          { title: 'Amusement Park Passes 🎡', desc: 'Pre-book passes for the top kid-friendly amusement parks with fast-track entry.' },
          { title: 'Baby Stroller & Gear Rental 👶', desc: 'Save luggage space! Rent a premium stroller and child booster seats.' }
        ];
      case 'Group':
        return [
          { title: 'Private Villa Upgrade 🏡', desc: 'Upgrade your rooms to a luxury private villa with a private pool and BBQ setup.' },
          { title: 'Private Tour Charter 🚐', desc: 'Get a dedicated private minibus with a local guide for your group.' }
        ];
      case 'Senior Citizen':
        return [
          { title: 'Relaxed Pace Sightseeing 🌸', desc: 'A slower-paced itinerary with priority seating and minimal walking requirements.' },
          { title: 'Ground Floor Room Request 🏨', desc: 'Complimentary request for ground floor or wheelchair-accessible hotel rooms.' },
          { title: 'On-Call Medical Assistance 🩺', desc: '24/7 access to local medical assistance partners for peace of mind.' }
        ];
      default:
        return [];
    }
  };

  // Checkout submission
  const handleCheckoutSubmit = async () => {
    setLoading(true);
    setTotalPaid(grandTotal);

    try {
      const pendingBookings = [];

      // Create a database booking for each cart item
      for (const item of cart) {
        // Construct stay/transport/food objects
        const transportObj = customizations.transport !== 'none' ? {
          name: customizations.transport === 'flight' ? 'IndiGo Non-stop Flight' : customizations.transport === 'train' ? 'Rajdhani AC 2-Tier' : 'SRS Volvo AC Sleeper',
          price: getTransportRate() * totalMultipliers
        } : null;

        const stayObj = customizations.stay !== 'none' ? {
          name: customizations.stay === 'luxury' ? 'Luxury Beach Resort' : customizations.stay === 'boutique' ? 'Boutique Garden Hotel' : 'Budget Comfort Inn',
          price: getStayRate()
        } : null;

        const foodObj = customizations.food !== 'none' ? {
          preference: travelers[0]?.specialRequirements?.mealPreference || 'Vegetarian',
          mealPlan: customizations.food === 'all' ? 'All-Inclusive Full Board' : 'Bed & Breakfast',
          price: getFoodRate() * totalMultipliers
        } : null;

        const payload = {
          name: travelers[0]?.name || 'Primary Traveler',
          email: travelers[0]?.email || 'user@example.com',
          travelDate: formData.travelDate,
          numberOfPeople: formData.numberOfPeople,
          fromCity: formData.fromCity,
          destination: `dynamic_trip_${item.destination.replace(/[\s,]+/g, '_').toLowerCase()}`,
          destinationObj: {
            name: item.destination,
            location: item.destination,
            category: item.type === 'Beach Trip' ? 'beach' : item.type === 'Friends Trip' ? 'adventure' : 'historical',
            price: item.price,
            description: `Seeded package tour to ${item.destination}. Includes ${item.duration || 'duration packages'}.`,
            image_url: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000'
          },
          status: 'Confirmed', // Automatically confirm on successful checkout payment
          transport: transportObj,
          stay: stayObj,
          food: foodObj,
          totalCost: (item.price * totalMultipliers + (getTransportRate() * totalMultipliers) + getStayRate() + (getFoodRate() * totalMultipliers)),
          payment: {
            method: paymentMethod.toUpperCase(),
            amount: grandTotal,
            status: 'Success',
            transactionId: 'PENDING'
          },
          // NEW DETAILS FIELDS
          travelers: travelers.map(t => ({
            name: t.name,
            age: parseInt(t.age) || 0,
            gender: t.gender,
            mobile: t.mobile,
            email: t.email,
            ageCategory: getAgeCategory(t.age),
            specialRequirements: t.specialRequirements
          })),
          travelerType: getTravelerType(travelers),
          pricingBreakdown: {
            basePrice: item.price,
            totalMultipliers: totalMultipliers,
            finalBasePrice: item.price * totalMultipliers,
            transportCost: getTransportRate() * totalMultipliers,
            stayCost: getStayRate(),
            foodCost: getFoodRate() * totalMultipliers
          }
        };

        pendingBookings.push(payload);
      }

      // Save to localStorage for SuccessPage to process
      localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));

      // Load Razorpay SDK
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // Fetch Razorpay Key ID
      const keyRes = await fetch('/api/get-razorpay-key');
      const keyData = await keyRes.json();

      // Create Razorpay Order
      const amountInPaise = Math.round(Number(grandTotal) * 100);
      if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
        throw new Error('Invalid payment amount. Please check your cart totals.');
      }

      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          paymentMethod
        })
      });

      const order = await res.json();
      if (!res.ok) {
        throw new Error(order.error || 'Server error');
      }

      const options = {
        key: keyData.key,
        amount: order.amount,
        currency: "INR",
        name: "AI Tourist Assistant",
        description: "Trip Booking",
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: order.amount,
                email: travelers[0]?.email || 'user@example.com',
                method: paymentMethod
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.href = `/success?session_id=${response.razorpay_payment_id}`;
            } else {
              window.location.href = '/cancel';
            }
          } catch (err) {
            console.error('Verification failed', err);
            window.location.href = '/cancel';
          }
        },
        prefill: {
          name: travelers[0]?.name || '',
          email: travelers[0]?.email || '',
        },
        theme: {
          color: "#10b981"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        console.error("Payment failed: " + response.error.description);
        window.location.href = '/cancel';
      });
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert('Checkout failed! ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Dynamic Progress indicator */}
      {step !== 'cart' && step !== 'success' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px' }}>
          {['details', 'customize', 'payment'].map((s, idx) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step === s ? 'var(--accent)' : (idx === 0 || (idx === 1 && step === 'payment') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'),
                  color: step === s ? '#000' : (idx === 0 || (idx === 1 && step === 'payment') ? '#10b981' : 'var(--text-muted)'),
                  fontWeight: 'bold', border: step === s ? '2px solid var(--accent)' : '1px solid var(--border)'
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontWeight: '600', color: step === s ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'capitalize', fontSize: '14px' }}>
                  {s === 'details' ? 'Travelers' : s === 'customize' ? 'Upgrades' : 'Payment'}
                </span>
              </div>
              {idx < 2 && <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.08)', margin: '0 20px' }}></div>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Cart Items Stage */}
      {step === 'cart' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🛒 Review Your Cart</h2>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '20px' }}>Your cart is empty. Explore some trips and add them to your cart!</p>
              <button onClick={() => navigate('/trips')} className="btn btn-accent">Explore Trips</button>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Trip Details</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Price (₹)</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={`${item.id}-${index}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>{item.destination}</div>
                        <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px', display: 'inline-block' }}>{item.type}</div>
                      </td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', fontSize: '18px', fontWeight: 'bold' }}>₹{item.price.toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button className="btn" style={{ padding: '8px 12px', background: 'transparent', color: 'var(--danger)' }} onClick={() => removeItem(item.id)}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0 }}>Total: <span style={{ color: 'var(--accent)', fontSize: '26px' }}>₹{baseTotal.toLocaleString()}</span></h3>
                <button onClick={() => setStep('details')} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}>
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 1: Traveler Details */}
      {step === 'details' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>👤 Traveler Information</h3>
          <form onSubmit={(e) => { e.preventDefault(); setStep('customize'); }}>
            
            {/* Common Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Travel Date</label>
                <input required type="date" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Number of Travelers</label>
                <input required type="number" min="1" max="10" value={formData.numberOfPeople} onChange={e => handleNumPeopleChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Departure City</label>
                <select value={formData.fromCity} onChange={e => setFormData({ ...formData, fromCity: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>
            </div>

            {/* Dynamic Travelers forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
              {travelers.map((t, idx) => {
                const cat = getAgeCategory(t.age);
                const isPrimary = idx === 0;
                return (
                  <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        👤 Traveler #{idx + 1} {isPrimary && <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '10px' }}>Primary Contact</span>}
                      </h4>
                      <span style={{
                        fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px',
                        background: cat === 'Adult' ? 'rgba(59,130,246,0.15)' : cat === 'Child' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: cat === 'Adult' ? '#60a5fa' : cat === 'Child' ? '#f59e0b' : '#10b981'
                      }}>
                        {cat} ({cat === 'Adult' ? 'Full Price' : cat === 'Child' ? '50% Off' : 'Free'})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Full Name</label>
                        <input required type="text" placeholder="Full Name" value={t.name} onChange={e => updateTravelerField(idx, 'name', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Age</label>
                        <input required type="number" placeholder="Age" min="0" max="120" value={t.age} onChange={e => updateTravelerField(idx, 'age', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gender</label>
                        <select value={t.gender} onChange={e => updateTravelerField(idx, 'gender', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mobile Number {isPrimary && '*'}</label>
                        <input required={isPrimary} type="tel" placeholder="Mobile Number" value={t.mobile || ''} onChange={e => updateTravelerField(idx, 'mobile', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email Address {isPrimary && '*'}</label>
                        <input required={isPrimary} type="email" placeholder="Email Address" value={t.email || ''} onChange={e => updateTravelerField(idx, 'email', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '10px' }}>SPECIAL REQUIREMENTS & PREFERENCES</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.specialRequirements?.wheelchair ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)', border: t.specialRequirements?.wheelchair ? '1px solid var(--accent)' : '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}>
                          <input type="checkbox" checked={t.specialRequirements?.wheelchair || false} onChange={e => updateTravelerRequirement(idx, 'wheelchair', e.target.checked)} style={{ display: 'none' }} />
                          ♿ Wheelchair Assistance
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.specialRequirements?.seniorAssistance ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)', border: t.specialRequirements?.seniorAssistance ? '1px solid var(--accent)' : '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}>
                          <input type="checkbox" checked={t.specialRequirements?.seniorAssistance || false} onChange={e => updateTravelerRequirement(idx, 'seniorAssistance', e.target.checked)} style={{ display: 'none' }} />
                          🤝 Senior Citizen Assistance
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.specialRequirements?.extraLuggage ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)', border: t.specialRequirements?.extraLuggage ? '1px solid var(--accent)' : '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}>
                          <input type="checkbox" checked={t.specialRequirements?.extraLuggage || false} onChange={e => updateTravelerRequirement(idx, 'extraLuggage', e.target.checked)} style={{ display: 'none' }} />
                          🧳 Extra Luggage (+₹1,000)
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}>
                          🥗 Meal Preference:
                          <select value={t.specialRequirements?.mealPreference || 'No Preference'} onChange={e => updateTravelerRequirement(idx, 'mealPreference', e.target.value)} style={{ padding: '2px 8px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                            <option value="No Preference">No Preference</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Traveler Profile Detection & Recommendations */}
            {travelers.length > 0 && (
              <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(129, 140, 248, 0.05)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Sparkles size={20} color="#818cf8" />
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>
                    Traveler Profile detected: <span style={{ color: 'var(--accent)' }}>{getTravelerType(travelers)}</span>
                  </span>
                </div>
                <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Based on your travelers list, our AI recommends adding the following items to your package:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {getPersonalizedRecommendations(getTravelerType(travelers)).map((rec, rIdx) => (
                    <div key={rIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>{rec.title}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" onClick={() => setStep('cart')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back to Cart
              </button>
              <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Continue to Upgrades <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Customizations & Upgrades */}
      {step === 'customize' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>✈️ Customize Your Journey</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
            
            {/* Transport Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Select Transport Option</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per person</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (Self-arrange)', price: 0 },
                  { id: 'flight', label: '✈️ Flight Upgrade', price: 5000 },
                  { id: 'train', label: '🚂 AC Train Coach', price: 1500 },
                  { id: 'bus', label: '🚌 Volvo Bus Sleeper', price: 800 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, transport: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.transport === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.transport === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Stay Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Select Hotel Class (Assumes 4 Nights)</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per stay</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (Self-arrange)', price: 0 },
                  { id: 'luxury', label: '🏨 Luxury 5★ Hotel', price: 8000 * 4 },
                  { id: 'boutique', label: '🏨 Boutique Hotel', price: 4000 * 4 },
                  { id: 'budget', label: '🏨 Budget Comfort Inn', price: 1500 * 4 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, stay: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.stay === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.stay === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Meal Package Plan (Assumes 5 Days)</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per person</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (No pre-booked food)', price: 0 },
                  { id: 'all', label: '🍽️ All-Inclusive Meals', price: 1500 * 5 },
                  { id: 'breakfast', label: '🍽️ Breakfast Only', price: 400 * 5 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, food: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.food === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.food === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep('details')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Details
            </button>
            <button onClick={() => setStep('payment')} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Continue to Payment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment */}
      {step === 'payment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          {/* Checkout Payment Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck color="#10b981" /> Secure Checkout</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <button onClick={() => setPaymentMethod('card')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: paymentMethod === 'card' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                  border: paymentMethod === 'card' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  color: paymentMethod === 'card' ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.3s'
                }}>
                <CreditCard size={18} /> Card Payment
              </button>
              <button onClick={() => setPaymentMethod('upi')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: paymentMethod === 'upi' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                  border: paymentMethod === 'upi' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  color: paymentMethod === 'upi' ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.3s'
                }}>
                <QrCode size={18} /> BHIM UPI QR
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '15px' }}>
                You will complete your transaction securely via Razorpay using {paymentMethod === 'card' ? 'Card' : 'UPI'}.
              </p>
              <button disabled={loading} onClick={handleCheckoutSubmit} className="btn btn-accent" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}>
                {loading ? 'Opening Razorpay...' : `Pay & Book Now (₹${grandTotal.toLocaleString()})`}
              </button>
            </div>

            <button onClick={() => setStep('customize')} className="btn" style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', marginTop: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
              ← Modify customizations
            </button>
          </div>

          {/* Pricing Summary Sidepanel */}
          <div className="glass-panel" style={{ padding: '30px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Invoice Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span>Itemized Breakdown</span>
                <span>Amount</span>
              </div>

              {/* Travelers pricing factor explanation */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>TRAVELERS PRICE FACTOR</strong>
                {travelers.map((t, idx) => {
                  const cat = getAgeCategory(t.age);
                  const mult = getPricingMultiplier(cat);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span>#{idx+1} {t.name || `Traveler ${idx+1}`} ({cat})</span>
                      <span>{mult === 0 ? 'FREE' : `${mult * 100}%`}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                  <span>Total Pricing Factor:</span>
                  <span>{totalMultipliers}x</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Package ({cart.length} Trip{cart.length > 1 ? 's' : ''})</span>
                <span style={{ fontWeight: '600' }}>₹{baseTotal.toLocaleString()}</span>
              </div>

              {customizations.transport !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Transport ({customizations.transport === 'flight' ? 'Flight' : customizations.transport === 'train' ? 'AC Train' : 'AC Bus'})
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{transportTotal.toLocaleString()}</span>
                </div>
              )}

              {customizations.stay !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Hotel Stay Upgrade
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{stayTotal.toLocaleString()}</span>
                </div>
              )}

              {customizations.food !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Meals ({customizations.food === 'all' ? 'All-inclusive' : 'Breakfast'})
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{foodTotal.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Profile Class</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{getTravelerType(travelers)}</span>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Grand Total</span>
              <span style={{ color: 'var(--accent)', fontSize: '28px', fontWeight: 'bold' }}>₹{grandTotal.toLocaleString()}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>
              🔒 <strong>SSL Encrypted:</strong> Your checkout session is completely encrypted. Safe MERN AI travel processing assured.
            </div>
          </div>

        </div>
      )}

      {/* STEP 4: Success Confirmed Screen */}
      {step === 'success' && (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', animation: 'scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '25px', borderRadius: '50%', color: '#10b981', marginBottom: '25px' }}>
            <CheckCircle size={70} />
          </div>
          
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px', color: 'var(--text-main)' }}>Booking Confirmed! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
            Congratulations, <strong>{travelers[0]?.name || 'Primary Traveler'}</strong>! Your customized trip packages have been successfully booked and payment has been verified. A confirmation ticket has been dispatched to <strong>{travelers[0]?.email || 'user@example.com'}</strong>.
          </p>

          <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border)', borderRadius: '15px', padding: '25px', maxWidth: '600px', margin: '0 auto 40px auto', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Booking Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div><strong>Travel Date:</strong> {new Date(formData.travelDate).toLocaleDateString()}</div>
              <div><strong>Travelers Count:</strong> {formData.numberOfPeople} Person(s)</div>
              <div><strong>Departure From:</strong> {formData.fromCity}</div>
              <div><strong>Payment Transaction ID:</strong> <span style={{ color: 'var(--accent)' }}>{confirmedBookings[0]?.payment?.transactionId || 'TXN-SUCCESS'}</span></div>
              <div><strong>Grand Total Paid:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{totalPaid.toLocaleString()}</span></div>
              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <strong>Booked Packages:</strong>
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  {confirmedBookings.map((b, i) => (
                    <li key={i} style={{ color: 'var(--text-muted)' }}>
                      {b.destination?.name || 'Custom Trip Package'} (Status: <span style={{ color: '#10b981' }}>{b.status}</span>)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-accent" style={{ padding: '12px 30px', fontWeight: 'bold' }}>
              Go to My Account Dashboard
            </button>
            <button onClick={() => navigate('/')} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 30px' }}>
              Plan Another Trip
            </button>
          </div>
          
          <style>{`
            @keyframes scaleUp {
              from { transform: scale(0.8); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default CartPage;
