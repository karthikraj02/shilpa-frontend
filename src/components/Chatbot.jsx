import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MapPin, IndianRupee, Info, Mic, MicOff, Volume2, VolumeX, Settings, Plus, Trash2, Edit3, Search, MessageSquare, Download, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TripTable from './TripTable';
import TransportCards from './TransportCards';
import SeatSelector from './SeatSelector';
import AddonsSelector from './AddonsSelector';
import ReviewsSection from './ReviewsSection';
import EmergencyButton from './EmergencyButton';
import EmergencyModal from './EmergencyModal';
import FeedbackModal from './FeedbackModal';

const Chatbot = ({ addToCart }) => {
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your AI Tourist Assistant. Looking for a beach, mountain, or historical destination? Or do you want to book a trip?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageMimeType, setImageMimeType] = useState(null);
    const fileInputRef = useRef(null);
    const [bookingForm, setBookingForm] = useState(null);
    const [formData, setFormData] = useState({ travelDate: '', numberOfPeople: 1, fromCity: 'Bangalore' });
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
                mealPreference: 'No Preference',
                pregnant: false,
                medicalConditionSupport: false,
                medicalConditionDetails: '',
                petTraveler: false,
                accessibleTransport: false,
                emergencySupport: false
            }
        }
    ]);

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
                            mealPreference: 'No Preference',
                            pregnant: false,
                            medicalConditionSupport: false,
                            medicalConditionDetails: '',
                            petTraveler: false,
                            accessibleTransport: false,
                            emergencySupport: false
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

    const getAgeCategory = (age) => {
        const parsedAge = parseInt(age);
        if (Number.isNaN(parsedAge)) return 'Adult';
        if (parsedAge >= 12) return 'Adult';
        if (parsedAge >= 5) return 'Child';
        return 'Infant';
    };

    const getTravelerProfile = (traveler) => {
        const age = parseInt(traveler.age);
        const req = traveler.specialRequirements || {};
        if (req.pregnant) return 'Pregnant Traveler';
        if (req.medicalConditionSupport) return 'Medical Condition Support';
        if (req.petTraveler) return 'Pet Traveler';
        if (req.wheelchair || req.accessibleTransport) return 'Differently-Abled Traveler';
        if (req.seniorAssistance || (!Number.isNaN(age) && age >= 60)) return 'Senior Citizen';
        if (!Number.isNaN(age) && age >= 5 && age < 12) return 'Child';
        if (!Number.isNaN(age) && age < 5) return 'Infant';
        return 'Adult';
    };

    const getPricingMultiplier = (ageCategory) => {
        if (ageCategory === 'Adult') return 1.0;
        if (ageCategory === 'Child') return 0.5;
        return 0.0;
    };

    const getTravelersPriceMultiplier = () => {
        return travelers.reduce((sum, t) => sum + getPricingMultiplier(getAgeCategory(t.age)), 0);
    };

    const totalMultipliers = getTravelersPriceMultiplier();

    const travelerCounts = travelers.reduce((acc, t) => {
        const category = getAgeCategory(t.age);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    const getTravelerType = (travs) => {
        if (!travs || travs.length === 0) return 'Solo Traveler';
        const profiles = travs.map(getTravelerProfile);
        if (profiles.includes('Pregnant Traveler')) return 'Pregnant Travelers';
        if (profiles.includes('Medical Condition Support')) return 'Medical Condition Support';
        if (profiles.includes('Pet Traveler')) return 'Pet Travelers';
        if (profiles.includes('Differently-Abled Traveler')) return 'Differently-Abled Travelers';
        if (profiles.includes('Senior Citizen')) return 'Senior Citizen';
        const count = travs.length;
        const hasChildOrInfant = profiles.some(p => p === 'Child' || p === 'Infant');
        if (count === 1) return 'Solo Traveler';
        if (count === 2 && !hasChildOrInfant) return 'Couple';
        if (hasChildOrInfant) return 'Family';
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
            case 'Pregnant Travelers':
                return [
                    { title: 'Safe Destination Choices 🛡️', desc: 'Recommend calm, low-altitude, easy-access destinations optimized for comfort.' },
                    { title: 'Nearby Hospital & Clinic Info 🏥', desc: 'Provide medical facility locations and emergency contact details before travel.' },
                    { title: 'Comfortable Transport 🚗', desc: 'Prefer smooth, short transfers with extra rest breaks and supportive seating.' }
                ];
            case 'Differently-Abled Travelers':
                return [
                    { title: 'Wheelchair & Accessibility Support ♿', desc: 'Focus on wheelchair-friendly hotels, restaurants, and attractions.' },
                    { title: 'Accessible Transport 🚍', desc: 'Use ground transport options suited for accessible boarding and extra assistance.' },
                    { title: 'Accessible Activity Routes 🧭', desc: 'Suggest low-step sightseeing routes and easy-access entry points.' }
                ];
            case 'Medical Condition Support':
                return [
                    { title: 'Emergency Medical Information 🩺', desc: 'Carry clear access to local clinics, pharmacies, and emergency protocols.' },
                    { title: 'Nearby Hospitals & Pharmacies 🏥', desc: 'Recommend places with quick healthcare access close to stay locations.' },
                    { title: 'Health-Friendly Itinerary 💊', desc: 'Avoid exhausting schedules and risky physical activities.' }
                ];
            case 'Pet Travelers':
                return [
                    { title: 'Pet-Friendly Hotels 🏨', desc: 'Book properties that welcome pets and provide safe sleeping spaces.' },
                    { title: 'Pet-Friendly Attractions 🐾', desc: 'Find experiences that allow pets such as parks and outdoor venues.' },
                    { title: 'Pet Care Support 🐕', desc: 'Offer nearby vet contact details and pet supply stores as backup.' }
                ];
            default:
                return [];
        }
    };

    // Helper: returns true only when a real token is stored
    const isValidToken = (tok) => !!tok && tok !== 'null' && tok !== 'undefined' && tok.split('.').length === 3;

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username') || 'guest';
        // Only call /api/auth/me when there's actually a logged-in user
        if (!isValidToken(token) || username === 'guest') return;
        axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setTravelers(prev => {
                const copy = [...prev];
                if (copy[0]) {
                    copy[0].name = res.data.username || '';
                    copy[0].email = res.data.email || '';
                }
                return copy;
            });
        })
        .catch(err => {
            if (err?.response?.status === 401) {
                // Token is stale or signed with old secret – clear it
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setCurrentUser('guest');
            }
        });
    }, []);

    const messagesEndRef = useRef(null);
    const [topBeach, setTopBeach] = useState(null);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [allDestinations, setAllDestinations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [dynamicChips, setDynamicChips] = useState(['🏕️ Best Camping Spots', '🏖️ Top Beaches', '⛰️ Mountains', '🏛️ Historical Places', '🌿 Wildlife Safaris']);
    const [postBookingFlow, setPostBookingFlow] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isMicStarting, setIsMicStarting] = useState(false);
    const [micError, setMicError] = useState('');
    const isListeningRef = useRef(false);
    const voiceTranscriptRef = useRef('');
    const micErrorTimerRef = useRef(null);
    const [detailPage, setDetailPage] = useState(null);
    const [currentUser, setCurrentUser] = useState(localStorage.getItem('username') || 'guest');
    const [expandedHotel, setExpandedHotel] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [originCity, setOriginCity] = useState('');
    const [routeData, setRouteData] = useState(null);
    const [bookingChoice, setBookingChoice] = useState(null);
    const [showExternalLinks, setShowExternalLinks] = useState(false);
    const [postExternalBooking, setPostExternalBooking] = useState(false);
    const [externalBookingData, setExternalBookingData] = useState({ pnr: '', bookingReference: '', ticketFile: '', screenshotFile: '', showForm: false });
    const [itineraryTab, setItineraryTab] = useState(3); // 1 | 2 | 3 days
    const [officialBookingStep, setOfficialBookingStep] = useState('form'); // 'form' | 'providers'
    const [officialBookingFormData, setOfficialBookingFormData] = useState({ name: '', age: '', gender: 'Male', email: '', phone: '', fromCity: 'Bangalore', toCity: '', travelDate: '', returnDate: '', adults: 1, children: 0 });

    // Demo external booking states
    const [activeDemoProvider, setActiveDemoProvider] = useState(null);
    const [demoBookingStep, setDemoBookingStep] = useState('view'); // 'view' | 'form' | 'success'
    const [demoBookingForm, setDemoBookingForm] = useState({ fullName: '', email: '', mobile: '', travelers: 1, travelDate: '' });
    const [demoBookingResult, setDemoBookingResult] = useState(null);

    const handleDemoProviderClick = (providerName, providerType) => {
        setActiveDemoProvider({ name: providerName, type: providerType });
        setDemoBookingStep('view');
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        const dateStr = defaultDate.toISOString().split('T')[0];
        setDemoBookingForm({
            fullName: '',
            email: '',
            mobile: '',
            travelers: 1,
            travelDate: dateStr
        });
        setDemoBookingResult(null);
    };

    const getDemoProviderPrice = () => {
        if (!bookingChoice) return 0;
        const basePrice = bookingChoice.price || 5000;
        if (activeDemoProvider?.type === 'flight') {
            return Math.round(basePrice * 0.6);
        }
        return Math.round(basePrice * 0.2); // hotel per night
    };

    const submitDemoBooking = (e) => {
        e.preventDefault();
        if (!demoBookingForm.fullName || !demoBookingForm.email || !demoBookingForm.mobile) {
            alert('Please fill all required fields');
            return;
        }
        
        const bookingId = `${activeDemoProvider.type === 'flight' ? 'FL' : 'HT'}-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
        const singlePrice = getDemoProviderPrice();
        const totalPrice = singlePrice * demoBookingForm.travelers;
        
        setDemoBookingResult({
            id: bookingId,
            fullName: demoBookingForm.fullName,
            email: demoBookingForm.email,
            mobile: demoBookingForm.mobile,
            travelers: demoBookingForm.travelers,
            travelDate: demoBookingForm.travelDate,
            totalPrice: totalPrice,
            message: `Your demo booking has been successfully processed by ${activeDemoProvider.name}. This confirms reservation for academic project viva presentation.`
        });
        setDemoBookingStep('success');
    };
    const [showCommunityModal, setShowCommunityModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [communityFormData, setCommunityFormData] = useState({ placeName: '', description: '', category: 'hidden-gem', location: '', image: null });
    const [voiceSettings, setVoiceSettings] = useState({ speakerOn: false, voiceGender: 'female', speechSpeed: 1.0 });
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const recognitionRef = useRef(null);
    const recognitionRetryRef = useRef(0);

    const exportToPDF = async (elementId, filename) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
        }
    };

    useEffect(() => {
        if (detailPage) {
            setRealtimeData(null);
            setRouteData(null);
            // Auto-detect user location for distance via Geolocation API
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    
                    // Reverse geocode to get city name for the input field automatically
                    try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}`);
                        const geoData = await geoRes.json();
                        if (geoData && geoData.address) {
                            const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state;
                            setOriginCity(city);
                        }
                    } catch(e) { console.log('Reverse geocoding error', e); }
                }, (error) => {
                    console.log('Geolocation permission denied or failed.', error);
                });
            }

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(detailPage.place_name)}&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const { lat, lon } = data[0];
                        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                            .then(res => res.json())
                            .then(weatherData => {
                                setRealtimeData({
                                    lat, lon,
                                    temp: weatherData.current_weather.temperature,
                                    wind: weatherData.current_weather.windspeed,
                                    code: weatherData.current_weather.weathercode
                                });
                            });
                    }
                }).catch(e => console.log('Realtime fetch error', e));
        }
    }, [detailPage]);

    const calculateDistance = async () => {
        if (!originCity || !realtimeData) return;
        try {
            setRouteData({ calculating: true });
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originCity)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const originLat = data[0].lat;
                const originLon = data[0].lon;
                const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${realtimeData.lon},${realtimeData.lat}?overview=false`);
                const osrmData = await osrmRes.json();
                if (osrmData.routes && osrmData.routes.length > 0) {
                    const distanceKm = (osrmData.routes[0].distance / 1000).toFixed(1);
                    const timeHrs = (osrmData.routes[0].duration / 3600).toFixed(1);
                    setRouteData({ distance: distanceKm, time: timeHrs });
                } else {
                    setRouteData({ error: 'No driving route found (might be overseas).' });
                }
            } else {
                setRouteData({ error: 'Origin city not found.' });
            }
        } catch(e) { 
            console.log('Route fetch error', e); 
            setRouteData({ error: 'Error calculating route.' });
        }
    };

    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chatSearch, setChatSearch] = useState('');
    const [renamingChatId, setRenamingChatId] = useState(null);
    const [renameTitleInput, setRenameTitleInput] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [loadingChats, setLoadingChats] = useState(false);
    const isRestoringChat = useRef(false);
    const prevMessagesLength = useRef(1); // Starts at 1 with the initial greeting

    const currentChatIdRef = useRef(currentChatId);
    useEffect(() => {
        currentChatIdRef.current = currentChatId;
    }, [currentChatId]);

    const isSyncingRef = useRef(false);

    useEffect(() => {
        const syncMessageToDB = async () => {
            const tokenStr = localStorage.getItem('token');
            const username = localStorage.getItem('username') || 'guest';
            if (!tokenStr || tokenStr === 'null' || tokenStr === 'undefined' || username === 'guest' || isRestoringChat.current) {
                prevMessagesLength.current = messages.length;
                return;
            }

            if (messages.length > prevMessagesLength.current) {
                if (isSyncingRef.current) return;
                isSyncingRef.current = true;

                const newMessages = messages.slice(prevMessagesLength.current);
                prevMessagesLength.current = messages.length;
                let activeChatId = currentChatIdRef.current;

                if (!activeChatId) {
                    try {
                        const newChatRes = await axios.post('/api/chat/new', {}, {
                            headers: { Authorization: `Bearer ${tokenStr}` }
                        });
                        activeChatId = newChatRes.data._id;
                        currentChatIdRef.current = activeChatId;
                        setCurrentChatId(activeChatId);
                    } catch (err) {
                        console.error("Failed to auto-create chat", err);
                        isSyncingRef.current = false;
                        return;
                    }
                }

                for (const newMsg of newMessages) {
                    try {
                        await axios.post('/api/chat/message', {
                            chatId: activeChatId,
                            sender: newMsg.sender,
                            message: newMsg.text,
                            data: newMsg.data || [],
                            options: newMsg.options || [],
                            step: newMsg.step || ''
                        }, {
                            headers: { Authorization: `Bearer ${tokenStr}` }
                        });
                    } catch (err) {
                        console.error("Failed to save message to DB", err);
                    }
                }
                loadChatHistory();
                isSyncingRef.current = false;
            } else {
                prevMessagesLength.current = messages.length;
            }
        };

        syncMessageToDB();
    }, [messages]);

    const getUserIdFromToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return '';
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            return decoded.user.id;
        } catch (e) {
            console.error("Token decode error", e);
            return '';
        }
    };

    const loadChatHistory = async () => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username') || 'guest';
        // Skip silently for guests or missing/invalid tokens
        if (!isValidToken(token) || username === 'guest') return;
        setLoadingChats(true);
        try {
            const userId = getUserIdFromToken();
            if (!userId) return;
            const res = await axios.get(`/api/chat/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(res.data);
            // Auto load most recent chat on mount if not currently in a chat
            if (res.data.length > 0 && !currentChatId) {
                openChat(res.data[0]._id);
            }
        } catch (err) {
            if (err?.response?.status === 401) {
                // Token is stale – clear it so user knows to log in again
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setCurrentUser('guest');
            } else {
                console.error("Failed to load chat history", err);
            }
        } finally {
            setLoadingChats(false);
        }
    };

    const openChat = async (chatId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            isRestoringChat.current = true;
            const res = await axios.get(`/api/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentChatId(chatId);
            const mappedMessages = res.data.messages.map(m => ({
                text: m.message,
                sender: m.sender,
                data: m.data,
                options: m.options,
                step: m.step
            }));
            const finalMsgs = mappedMessages.length > 0 ? mappedMessages : [{ text: "👋 Hello! I am your AI Tourist Companion. Ask me to plan a beach trip, recommend places, suggest transport, or book hotels!", sender: "bot" }];
            setMessages(finalMsgs);
            prevMessagesLength.current = finalMsgs.length;
            setTimeout(() => {
                isRestoringChat.current = false;
            }, 100);
        } catch (err) {
            console.error("Failed to open chat", err);
            isRestoringChat.current = false;
        }
    };

    const startNewChat = () => {
        isRestoringChat.current = true;
        setCurrentChatId(null);
        const newGreeting = [{ text: "👋 Hello! I am your AI Tourist Companion. Ask me to plan a beach trip, recommend places, suggest transport, or book hotels!", sender: "bot" }];
        setMessages(newGreeting);
        setPostBookingFlow(null);
        setBookingForm(null);
        setBookingChoice(null);
        setShowExternalLinks(false);
        setPostExternalBooking(false);
        setExternalBookingData({ pnr: '', bookingReference: '', ticketFile: '', screenshotFile: '', showForm: false });
        prevMessagesLength.current = newGreeting.length;
        setTimeout(() => {
            isRestoringChat.current = false;
        }, 100);
    };

    const renameChat = async (chatId) => {
        if (!renameTitleInput.trim()) return;
        const token = localStorage.getItem('token');
        try {
            await axios.put(`/api/chat/rename/${chatId}`, { title: renameTitleInput }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRenamingChatId(null);
            setRenameTitleInput('');
            loadChatHistory();
        } catch (err) {
            console.error("Failed to rename chat", err);
        }
    };

    const deleteChat = async (chatId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (currentChatId === chatId) {
                startNewChat();
            }
            setDeleteConfirmId(null);
            loadChatHistory();
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    useEffect(() => {
        // Only attempt to load history for authenticated users
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username') || 'guest';
        if (isValidToken(token) && username !== 'guest') {
            loadChatHistory();
        }
    }, [currentUser]);

    // Dynamic Auth & Persisted History synchronization
    useEffect(() => {
        const handleAuth = async () => {
            const newUser = localStorage.getItem('username') || 'guest';
            setCurrentUser(newUser);
            
            const token = localStorage.getItem('token');
            if (token && newUser !== 'guest') {
                loadChatHistory();
                
                // Fetch Voice Settings
                try {
                    const userId = getUserIdFromToken();
                    if (userId) {
                        const prefsRes = await axios.get(`/api/preferences/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (prefsRes.data && prefsRes.data.voiceSettings) {
                            setVoiceSettings(prefsRes.data.voiceSettings);
                            localStorage.setItem(`voiceSettings_${newUser}`, JSON.stringify(prefsRes.data.voiceSettings));
                        }
                    }
                } catch (e) {
                    console.error('Failed to load voice preferences', e);
                }
                
                return;
            }
            
            // Fallback to local storage (e.g. for guest or if offline)
            const saved = localStorage.getItem(`chatHistory_${newUser}`);
            const savedVoiceSettings = localStorage.getItem(`voiceSettings_${newUser}`);
            if (saved) {
                setMessages(JSON.parse(saved));
            } else {
                setMessages([
                    { text: "Hi! I'm your AI Tourist Assistant. Looking for a beach, mountain, or historical destination? Or do you want to book a trip?", sender: 'bot' }
                ]);
            }
            if (savedVoiceSettings) {
                setVoiceSettings(JSON.parse(savedVoiceSettings));
            }
        };

        handleAuth();
        window.addEventListener('authChange', handleAuth);
        return () => window.removeEventListener('authChange', handleAuth);
    }, []);

    const updateVoiceSettings = async (newSettings) => {
        setVoiceSettings(newSettings);
        const username = localStorage.getItem('username') || 'guest';
        try {
            localStorage.setItem(`voiceSettings_${username}`, JSON.stringify(newSettings));
        } catch (err) {
            console.warn('Unable to persist voice settings locally', err);
        }

        const token = localStorage.getItem('token');
        const userId = getUserIdFromToken();
        if (token && userId) {
            try {
                await axios.put(`/api/preferences/${userId}`, { voiceSettings: newSettings }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error('Failed to save voice settings', err);
            }
        }
    };

    const handleSpeakerToggle = () => {
        updateVoiceSettings({ ...voiceSettings, speakerOn: !voiceSettings.speakerOn });
    };

    const handleVoicePreferenceChange = (field, value) => {
        updateVoiceSettings({ ...voiceSettings, [field]: value });
    };

    const handleListenClick = (text) => {
        if (!window.speechSynthesis) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        speakMessage(text, { ...voiceSettings, speakerOn: true });
    };

    const speakMessage = (text, customSettings = null) => {
        if (!window.speechSynthesis) return;
        const settings = customSettings || voiceSettings;
        if (!customSettings && !settings.speakerOn) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[\*#]/g, ''));
        utterance.rate = settings.speechSpeed || 1.0;
        
        let voices = window.speechSynthesis.getVoices();
        // Browser might need a moment to load voices
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                applyVoiceAndSpeak(utterance, voices, settings);
            };
        } else {
            applyVoiceAndSpeak(utterance, voices, settings);
        }
    };

    const applyVoiceAndSpeak = (utterance, voices, settings) => {
        let selectedVoice = null;
        if (settings.voiceGender === 'female') {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')) || voices.find(v => v.lang.startsWith('en'));
        } else {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel')) || voices.find(v => v.lang.startsWith('en'));
        }
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    const showMicError = (message) => {
        setMicError(message);
        if (micErrorTimerRef.current) {
            window.clearTimeout(micErrorTimerRef.current);
        }
        micErrorTimerRef.current = window.setTimeout(() => setMicError(''), 5000);
    };

    // ──────────────────────────────────────────────────────────────────────
    // Voice input (Web Speech API)
    //
    // Lifecycle rules:
    //  • Exactly ONE SpeechRecognition instance is alive per microphone session.
    //  • A session is finalised exactly once (finalizeVoiceSession is guarded),
    //    so onend + a button click can never produce two messages.
    //  • Only a MANUAL stop sends the message. An unexpected end just resets.
    //  • Recognition is NEVER auto-restarted, so 'no-speech' cannot loop.
    //    `continuous = true` already keeps one instance alive across pauses.
    // ──────────────────────────────────────────────────────────────────────

    const VOICE_LANG = 'en-US';   // unchanged from the original implementation
    // Consecutive failed voice sessions before telling the user something is wrong.
    // Reset by any successful recognition, so old errors never disable the mic.
    const MAX_NETWORK_FAILURES = 2;

    const manualStopRef = useRef(false);        // true only when the user clicked the mic to stop
    const sessionActiveRef = useRef(false);     // a voice session is in progress
    const sessionFinalizedRef = useRef(false);  // guards against double finalisation / double send
    const voiceBaseTextRef = useRef('');        // text that existed before the current recognition instance
    const fatalMicErrorRef = useRef(false);     // permission/hardware failure — never restart
    const finalizeTimerRef = useRef(null);      // fallback if onend never fires
    const isMountedRef = useRef(true);
    const handleSendRef = useRef(null);         // always points at the latest handleSend (no stale closures)

    // Keep the ref pointing at the current render's handleSend so the recognition
    // callbacks never send with a stale copy of `messages` / `input`.
    useEffect(() => {
        handleSendRef.current = handleSend;
    });

    const safeSetMicState = (listening, starting) => {
        if (!isMountedRef.current) return;
        setIsListening(listening);
        setIsMicStarting(starting);
    };

    const resetMicState = () => {
        isListeningRef.current = false;
        sessionActiveRef.current = false;
        safeSetMicState(false, false);
    };

    /** Detaches every handler and tears down the active recognition instance. */
    const teardownRecognition = ({ abort = false } = {}) => {
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        if (!recognition) return;
        // Detach first so a late onend/onerror from this dead instance is ignored.
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
            if (abort && typeof recognition.abort === 'function') recognition.abort();
            else recognition.stop();
        } catch (_) {
            /* already stopped or destroyed — nothing to do */
        }
    };

    const clearFinalizeTimer = () => {
        if (finalizeTimerRef.current) {
            window.clearTimeout(finalizeTimerRef.current);
            finalizeTimerRef.current = null;
        }
    };

    /**
     * Ends the session exactly once.
     * @param {boolean} shouldSend  true only for a deliberate user stop.
     */
    const finalizeVoiceSession = (shouldSend) => {
        if (sessionFinalizedRef.current) return;   // double-send guard
        sessionFinalizedRef.current = true;
        sessionActiveRef.current = false;
        clearFinalizeTimer();
        teardownRecognition();

        const transcript = (voiceTranscriptRef.current || '').trim();
        voiceTranscriptRef.current = '';
        voiceBaseTextRef.current = '';
        resetMicState();

        if (!isMountedRef.current) return;

        // Empty / whitespace-only speech never sends a message.
        if (!shouldSend || !transcript) {
            if (transcript) setInput(transcript);   // keep whatever was captured
            return;
        }

        setInput(transcript);
        // Feed straight into the existing text-chat pipeline.
        const send = handleSendRef.current;
        if (typeof send === 'function') send(transcript);
    };

    /** Creates and starts the single recognition instance for this session. */
    const startRecognitionInstance = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        teardownRecognition({ abort: true });   // never leave an orphan instance behind

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = VOICE_LANG;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        // continuous = true keeps ONE instance alive across natural pauses, which
        // removes the restart-on-every-onend loop the previous version relied on.
        recognition.continuous = true;

        recognition.onstart = () => {
            if (!isMountedRef.current) return;
            isListeningRef.current = true;
            safeSetMicState(true, false);
        };

        recognition.onresult = (event) => {
            // Rebuild from index 0: with continuous recognition `event.results`
            // holds the whole session, so rebuilding cannot duplicate or drop words.
            let finalText = '';
            let interimText = '';
            for (let i = 0; i < event.results.length; i++) {
                const chunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalText += chunk;
                else interimText += chunk;
            }

            const base = voiceBaseTextRef.current;
            const committed = `${base} ${finalText}`.replace(/\s+/g, ' ').trim();
            voiceTranscriptRef.current = committed;

            if (finalText.trim()) {
                // Recognition is clearly working — clear any earlier error budget.
                recognitionRetryRef.current = 0;
            }

            const display = `${committed} ${interimText}`.replace(/\s+/g, ' ').trim();
            if (isMountedRef.current) setInput(display);
        };

        recognition.onerror = (event) => {
            const code = event?.error;

            if (code === 'aborted') return;               // we caused it — onend will follow

            if (code === 'not-allowed' || code === 'service-not-allowed') {
                fatalMicErrorRef.current = true;
                showMicError('Microphone permission denied. Click the 🔒 icon in your browser address bar and allow microphone access.');
                return;                                   // onend resets the state
            }

            if (code === 'audio-capture') {
                fatalMicErrorRef.current = true;
                showMicError('No microphone detected. Please connect a microphone and try again.');
                return;
            }

            if (code === 'network') {
                // Counts CONSECUTIVE failures across sessions; any successful
                // recognition resets it, so the mic is never disabled by old errors.
                recognitionRetryRef.current = (recognitionRetryRef.current || 0) + 1;
                if (recognitionRetryRef.current >= MAX_NETWORK_FAILURES) {
                    showMicError('Voice recognition unavailable. Make sure you are using Chrome/Edge and are connected to the internet.');
                }
                return;                                   // onend ends the session
            }

            if (code === 'no-speech') return;             // onend ends the session gracefully

            console.error('Speech recognition error:', code);
        };

        recognition.onend = () => {
            // A manual stop finalises and sends. Every other ending — silence,
            // an error, or the browser closing the stream — simply keeps whatever
            // was captured and returns the mic to idle. Nothing restarts, so no
            // loop is possible.
            finalizeVoiceSession(manualStopRef.current === true);
        };

        try {
            recognition.start();
            return true;
        } catch (e) {
            console.error('Recognition start failed:', e);
            teardownRecognition();
            return false;
        }
    };

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showMicError('Voice recognition is not supported. Please use Chrome or Edge browser.');
            return;
        }

        // ── Second click: stop, finalise, send ──────────────────────────────
        if (sessionActiveRef.current) {
            manualStopRef.current = true;
            isListeningRef.current = false;
            safeSetMicState(false, false);

            const recognition = recognitionRef.current;
            if (recognition) {
                try {
                    recognition.stop();   // onend finalises and sends
                } catch (_) {
                    finalizeVoiceSession(true);
                    return;
                }
                // Fallback: some browsers never fire onend after stop().
                // finalizeVoiceSession is guarded, so this can't double-send.
                clearFinalizeTimer();
                finalizeTimerRef.current = window.setTimeout(() => finalizeVoiceSession(true), 1200);
            } else {
                finalizeVoiceSession(true);
            }
            return;
        }

        // ── First click: start a fresh session ──────────────────────────────
        setMicError('');
        manualStopRef.current = false;
        sessionFinalizedRef.current = false;
        fatalMicErrorRef.current = false;
        clearFinalizeTimer();

        // Anything already typed stays and voice is appended to it.
        voiceBaseTextRef.current = (input || '').trim();
        voiceTranscriptRef.current = voiceBaseTextRef.current;

        if (window.speechSynthesis?.speaking) {
            window.speechSynthesis.cancel();
        }

        sessionActiveRef.current = true;
        safeSetMicState(false, true);

        // SpeechRecognition requests microphone permission itself — no separate
        // getUserMedia stream is opened here any more. Denials arrive through
        // onerror as 'not-allowed'.
        if (!startRecognitionInstance()) {
            sessionActiveRef.current = false;
            sessionFinalizedRef.current = true;
            resetMicState();
            showMicError('Could not start voice recognition. Please check your browser settings and try again.');
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            manualStopRef.current = false;      // never send from an unmounting component
            sessionActiveRef.current = false;
            sessionFinalizedRef.current = true; // block any late finalisation
            isListeningRef.current = false;
            clearFinalizeTimer();
            teardownRecognition({ abort: true });
            if (micErrorTimerRef.current) {
                window.clearTimeout(micErrorTimerRef.current);
            }
        };
    }, []);

    // Keep LocalStorage synchronized on message changes for guests
    useEffect(() => {
        const username = localStorage.getItem('username') || 'guest';
        if (username === 'guest') {
            localStorage.setItem(`chatHistory_${username}`, JSON.stringify(messages));
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, bookingForm]);

    useEffect(() => {
        axios.get('/api/destinations').then(res => {
            setAllDestinations(res.data);
            const beaches = res.data.filter(d => d.category === 'beach');
            if (beaches.length > 0) setTopBeach(beaches[0]);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (pendingBookings.length === 0) return;

        const interval = setInterval(async () => {
            const stillPending = [];
            let statusChanged = false;
            for (let id of pendingBookings) {
                try {
                    const res = await axios.get(`/api/bookings/${id}/status`);
                    if (res.data.status === 'Confirmed') {
                        setMessages(prev => [...prev, { text: `🎉 Great news! Your booking for ${res.data.destination.name} has just been Confirmed by the Admin!`, sender: 'bot' }]);
                        statusChanged = true;
                    } else if (res.data.status === 'Cancelled' || res.data.status === 'Rejected') {
                        setMessages(prev => [...prev, { text: `❌ We're sorry, your booking for ${res.data.destination.name} was cancelled/rejected by the admin. Please contact support.`, sender: 'bot' }]);
                        statusChanged = true;
                    } else {
                        stillPending.push(id);
                    }
                } catch {
                    stillPending.push(id);
                }
            }
            if (statusChanged) {
                setPendingBookings(stillPending);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [pendingBookings]);

    useEffect(() => {
        // DYNAMIC ENVIRONMENT THEMES
        if (detailPage && detailPage.category) {
            const cat = detailPage.category.toLowerCase();
            if (cat === 'beach') document.body.style.background = 'radial-gradient(circle at top right, #0ea5e9, #0f172a, #020617)';
            else if (cat === 'mountain') document.body.style.background = 'radial-gradient(circle at top right, #94a3b8, #1e293b, #020617)';
            else if (cat === 'historical' || cat === 'cultural') document.body.style.background = 'radial-gradient(circle at top right, #d97706, #331500, #020617)';
            else if (cat === 'wildlife' || cat === 'nature') document.body.style.background = 'radial-gradient(circle at top right, #16a34a, #064e3b, #020617)';
            else document.body.style.background = 'radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617)';
        } else {
            document.body.style.background = 'radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617)';
        }
    }, [detailPage]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result);
            setImageMimeType(file.type);
        };
        reader.readAsDataURL(file);
    };

    const handleSend = async (overrideMessage = null) => {
        // The Send button passes a click event into this handler, so anything
        // that is not a string is treated as "no override" and the current
        // input state is used instead.
        const override = typeof overrideMessage === 'string' ? overrideMessage : null;
        const draft = override !== null ? override : input;
        if (!draft.trim() && !selectedImage) return; // Allow sending just image
        if (isSending) return;
        setIsSending(true);

        const userMsg = draft;
        const currentImage = selectedImage;
        const currentMimeType = imageMimeType;
        
        setInput('');
        setSelectedImage(null);
        setImageMimeType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setMessages(prev => [...prev, { text: userMsg, sender: 'user', image: currentImage }]);

        const tokenStr = localStorage.getItem('token');
        const config = (tokenStr && tokenStr !== 'null') ? { headers: { Authorization: `Bearer ${tokenStr}` } } : {};

        if (postBookingFlow && postBookingFlow.step === 'payment_amount') {
            // Ignore typed messages during Razorpay payment - payment is handled by the modal
            setMessages(prev => [...prev, { text: 'Please complete your payment in the Razorpay window. If the window did not open, click the Pay Now button above.', sender: 'bot' }]);
            setIsSending(false);
            return;
        }

        if (postBookingFlow && postBookingFlow.step === 'review_form') {
            setMessages(prev => [...prev, { text: 'Please complete the feedback form above to finish your booking.', sender: 'bot' }]);
            setIsSending(false);
            return;
        }

        try {
            const chatHistory = messages.slice(-8).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
            const payload = { message: userMsg, history: chatHistory };
            if (currentImage) {
                payload.image = currentImage;
                payload.mimeType = currentMimeType;
            }
            const res = await axios.post('/api/chat', payload, config);

            const botMsg = { 
                text: res.data.reply, 
                sender: 'bot', 
                data: res.data.data, 
                itinerary: res.data.itinerary,
                travel_cards: res.data.travel_cards,
                related_places: res.data.related_places || [],
                action: res.data.action,
                preview_card: res.data.preview_card || null,
                full_destination: res.data.full_destination || null,
                google_maps: res.data.google_maps || null,
                showTrips: res.data.action === 'SHOW_TRIPS' 
            };
            
            if (res.data.dynamic_chips && Array.isArray(res.data.dynamic_chips) && res.data.dynamic_chips.length > 0) {
                setDynamicChips(res.data.dynamic_chips);
            }
            
            if (voiceSettings.speakerOn && res.data.reply) {
                speakMessage(res.data.reply);
            }
            
            setMessages(prev => [...prev, botMsg]);

            if (res.data.action === 'START_BOOKING') {
                setBookingForm({ destination: res.data.destination });
            }

        } catch (err) {
            setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting to the server.', sender: 'bot' }]);
        } finally {
            setIsSending(false);
        }
    };

        const callEmergency = async (query, opts = {}) => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const payload = { query };
                if (opts.lat && opts.lng) { payload.lat = opts.lat; payload.lng = opts.lng; }
                if (opts.tripId) payload.tripId = opts.tripId;
                setMessages(prev => [...prev, { text: query, sender: 'user' }]);
                const res = await axios.post('/api/emergency', payload, config);
                if (res.data && res.data.aiResponse) {
                    setMessages(prev => [...prev, { text: res.data.aiResponse, sender: 'bot' }]);
                } else {
                    setMessages(prev => [...prev, { text: 'Sorry, could not get emergency guidance right now.', sender: 'bot' }]);
                }
            } catch (err) {
                setMessages(prev => [...prev, { text: 'Emergency service unavailable. Try again or contact local authorities.', sender: 'bot' }]);
            }
        };

    const submitBooking = async (e) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!travelers[0]?.name || !travelers[0]?.email) {
                setMessages(prev => [...prev, { text: 'Please fill in at least the primary traveler name and email.', sender: 'bot' }]);
                return;
            }

            const payload = {
                travelDate: formData.travelDate || new Date().toISOString().split('T')[0],
                numberOfPeople: formData.numberOfPeople || travelers.length,
                fromCity: formData.fromCity || 'Bangalore',
                name: travelers[0]?.name || 'Primary Traveler',
                email: travelers[0]?.email || 'user@example.com',
                phone: travelers[0]?.mobile || '0000000000',
                destination: bookingForm.destination?._id || bookingForm.destination?.id || (bookingForm.destination ? 'dynamic_' + Date.now() : 'unknown'),
                destinationObj: (!bookingForm.destination?._id || bookingForm.destination?._id.toString().startsWith('dynamic_')) ? bookingForm.destination : null,
                travelers: travelers.map(t => ({
                    name: t.name || 'Traveler',
                    age: parseInt(t.age) || 30,
                    gender: t.gender || 'Male',
                    mobile: t.mobile || '0000000000',
                    email: t.email || 'user@example.com',
                    specialRequirements: t.specialRequirements || {}
                })),
                pricingBreakdown: {
                    basePrice: bookingForm.destination?.price || 5000,
                    adultCount: travelerCounts.Adult || 0,
                    childCount: travelerCounts.Child || 0,
                    infantCount: travelerCounts.Infant || 0,
                    totalMultipliers: totalMultipliers,
                    finalBasePrice: (bookingForm.destination?.price || 5000) * totalMultipliers
                },
                totalCost: (bookingForm.destination?.price || 5000) * totalMultipliers
            };
            const token = localStorage.getItem('token');
            const config = (token && token !== 'null' && token !== 'undefined') ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.post('/api/bookings', payload, config);
            const bookingId = response.data._id;
            
            const cat = (bookingForm.destination?.category || '').toLowerCase();
            const destName = bookingForm.destination?.name || 'your destination';
            let transportModes = [
                {label: '✈️ Flight  🔴 High CO₂', val: 'Flight', icon: '✈️'},
                {label: '🚌 Bus  🟡 Medium CO₂', val: 'Bus', icon: '🚌'},
                {label: '🚂 Train  🟢 Eco-Friendly', val: 'Train', icon: '🚂'}
            ];
            if (cat === 'beach' || cat === 'wildlife') {
                transportModes.push({label: '🛳️ Luxury Cruise  🟡 Medium CO₂', val: 'Cruise', icon: '🛳️'});
                transportModes.push({label: '🚤 Speedboat  🟢 Low CO₂', val: 'Speedboat', icon: '🚤'});
            }
            if (cat === 'mountain' || cat === 'adventure') {
                transportModes.push({label: '🚁 Helicopter Drop  🔴 High CO₂', val: 'Helicopter', icon: '🚁'});
            }
            transportModes.push({label: '🛩️ Private Jet (Luxury)  🔴 High CO₂', val: 'PrivateJet', icon: '🛩️'});

            setMessages(prev => [...prev, 
                { text: `Booking successfully created for ${destName}! 🎉 Let's finalize your trip details.`, sender: 'bot' },
                { 
                    text: 'Select your preferred transport mode:',
                    sender: 'bot',
                    options: transportModes,
                    step: 'transport'
                }
            ]);
            setPostBookingFlow({
                basePrice: (bookingForm.destination?.price || 5000) * totalMultipliers,
                destination: bookingForm.destination,
                bookingId: bookingId,
                selections: {}
            });
            setBookingForm(null);
        } catch (err) {
            console.error('Booking submission error:', err);
            const errorMsg = err.response?.data?.msg || err.message || 'Failed to create booking. Please try again.';
            setMessages(prev => [...prev, { text: `Booking failed: ${errorMsg}`, sender: 'bot' }]);
        }
    };

    const handleOptionSelect = (step, option) => {
        setMessages(prev => [...prev, { text: option.label, sender: 'user' }]);

        if (step === 'transport') {
            const dest = postBookingFlow?.destination?.name || 'destination';
            const destLocation = postBookingFlow?.destination?.location || dest;
            const userCity = postBookingFlow?.fromCity || 'Bangalore';
            const carbonMap = { Flight: 80, Bus: 30, Train: 10, Cruise: 45, Speedboat: 15, Helicopter: 90, PrivateJet: 100 };
            const carbonVal = carbonMap[option.val] || 50;
            setPostBookingFlow(prev => ({ ...prev, carbonScore: carbonVal }));

            const carbonEmoji = carbonVal >= 70 ? '🔴' : carbonVal >= 30 ? '🟡' : '🟢';
            const carbonLabel = carbonVal >= 70 ? 'High' : carbonVal >= 30 ? 'Medium' : 'Low';

            // Standard transport types show rich cards from API
            const standardTypes = ['Flight', 'Bus', 'Train'];
            if (standardTypes.includes(option.val)) {
                setMessages(prev => [...prev, 
                    { text: `${carbonEmoji} Carbon Footprint: ${carbonLabel} (${carbonVal}/100). ${carbonVal <= 20 ? '🌿 Amazing eco-choice! You earned a Green Traveler badge! 🏅' : ''}`, sender: 'bot' },
                    { text: `Here are the best ${option.val.toLowerCase()} options from ${userCity} to ${dest}:`, sender: 'bot', transportSearch: { from: userCity, to: destLocation.split(',')[0].trim(), type: option.val.toLowerCase() } }
                ]);
            } else {
                // Exotic modes use button fallback
                let transportOptions = [];
                if (option.val === 'Cruise') transportOptions = [{label: '🛳️ Cordelia Cruise - ₹15000 (2 nights)', cost: 15000, name: 'Cordelia Cruise'}, {label: '🛳️ Angriya Cruise - ₹8000 (1 night)', cost: 8000, name: 'Angriya Cruise'}];
                else if (option.val === 'Speedboat') transportOptions = [{label: '🚤 Express Boat - ₹3000 (1h)', cost: 3000, name: 'Express Speedboat'}, {label: '🚤 Premium Yacht - ₹12000 (1.5h)', cost: 12000, name: 'Premium Yacht'}];
                else if (option.val === 'Helicopter') transportOptions = [{label: '🚁 HeliTaxi - ₹18000 (30min)', cost: 18000, name: 'HeliTaxi'}, {label: '🚁 Pawan Hans - ₹12000 (45min)', cost: 12000, name: 'Pawan Hans'}];
                else if (option.val === 'PrivateJet') transportOptions = [{label: '🛩️ JetSetGo - ₹250000 (1h)', cost: 250000, name: 'JetSetGo Private Jet'}, {label: '🛩️ Club One Air - ₹180000 (1.5h)', cost: 180000, name: 'Club One Air'}];

                setMessages(prev => [...prev, 
                    { text: `${carbonEmoji} Carbon Footprint: ${carbonLabel} (${carbonVal}/100). ${carbonVal <= 20 ? '🌿 Amazing eco-choice! You earned a Green Traveler badge! 🏅' : ''}`, sender: 'bot' },
                    { text: `Select your ${option.val} option:`, sender: 'bot', options: transportOptions.map(o => ({ label: o.label, val: o })), step: 'transport_selection' }
                ]);
            }
        }

        if (step === 'transport_selection') {
            setPostBookingFlow(prev => ({ ...prev, selections: { ...prev.selections, transport: option.val } }));
            const mode = option.val.name || '';
            const isFlight = mode.toLowerCase().includes('flight') || mode.toLowerCase().includes('jet') || mode.toLowerCase().includes('spicejet') || mode.toLowerCase().includes('indigo') || mode.toLowerCase().includes('air india');
            const isTrain = mode.toLowerCase().includes('exp') || mode.toLowerCase().includes('train') || mode.toLowerCase().includes('bharat') || mode.toLowerCase().includes('shatabdi') || mode.toLowerCase().includes('rajdhani');
            const transportType = isFlight ? 'flight' : isTrain ? 'train' : 'bus';

            setMessages(prev => [...prev, {
                text: `Great choice! Now choose your class & seat:`,
                sender: 'bot',
                showSeatSelector: transportType
            }]);
        }

        // seat_selection and addons are now handled by component callbacks, not buttons
        // (kept for exotic transport fallback button flow)
        if (step === 'seat_selection') {
            const extraCost = option.extraCost || 0;
            setPostBookingFlow(prev => ({ 
                ...prev, 
                selections: { 
                    ...prev.selections, 
                    seat: option.val, 
                    seatNumber: option.seat,
                    seatExtra: extraCost 
                } 
            }));
            setMessages(prev => [...prev, {
                text: '🧳 Select your travel extras:',
                sender: 'bot',
                showAddonsSelector: true
            }]);
        }

        if (step === 'addons') {
            // Legacy fallback for exotic modes
            const addonCost = option.cost || 0;
            const addonName = option.val === 'none' ? null : option.val;
            setPostBookingFlow(prev => ({
                ...prev, 
                selections: { 
                    ...prev.selections, 
                    addons: addonName ? [...(prev.selections.addons || []), { name: addonName, cost: addonCost }] : (prev.selections.addons || [])
                }
            }));

            if (option.val !== 'none') {
                setMessages(prev => [...prev, {
                    text: 'Add another extra, or skip:',
                    sender: 'bot',
                    options: [
                        {label: '🧳 Extra Baggage (+₹1500)', val: 'baggage', cost: 1500},
                        {label: '🍽️ Meals (+₹500)', val: 'meals', cost: 500},
                        {label: '🚗 Pickup (+₹2000)', val: 'pickup', cost: 2000},
                        {label: '🛡️ Insurance (+₹800)', val: 'insurance', cost: 800},
                        {label: '⏭️ Done', val: 'none', cost: 0}
                    ],
                    step: 'addons'
                }]);
            } else {
                let hotelOptions = [
                    {label: '🏨 Basic Hotel (₹2000/night)', val: 'Hotel', cost: 2000},
                    {label: '🏡 Homestay (₹1000/night)', val: 'Homestay', cost: 1000},
                    {label: '🏰 Luxury Resort (₹8000/night)', val: 'Luxury Resort', cost: 8000}
                ];

                if (postBookingFlow.destination && postBookingFlow.destination.hotels && postBookingFlow.destination.hotels.length > 0 && typeof postBookingFlow.destination.hotels[0] === 'object') {
                    hotelOptions = postBookingFlow.destination.hotels.map(h => ({
                        label: `🏨 ${h.name} (${h.type} - ₹${h.price_per_night}/night) ⭐${h.rating}`,
                        val: h.name,
                        cost: h.price_per_night,
                        hotelObj: h
                    }));
                }

                setMessages(prev => [...prev, {
                    text: 'Select your hotel:',
                    sender: 'bot',
                    options: hotelOptions,
                    step: 'stay'
                }]);
            }
        }

        if (step === 'stay') {
            setPostBookingFlow(prev => ({ ...prev, selections: { ...prev.selections, stay: { name: option.val, cost: option.cost } } }));
            setMessages(prev => [...prev, {
                text: 'Select food preference:',
                sender: 'bot',
                options: [{label: 'Veg', val: 'Veg'}, {label: 'Non-Veg', val: 'Non-Veg'}, {label: 'Both', val: 'Both'}],
                step: 'food_pref'
            }]);
        }

        if (step === 'food_pref') {
            setPostBookingFlow(prev => ({ ...prev, selections: { ...prev.selections, foodPref: option.val } }));
            setMessages(prev => [...prev, {
                text: 'Select meal plan:',
                sender: 'bot',
                options: [{label: 'Breakfast only (₹300)', val: 'Breakfast', cost: 300}, {label: 'Breakfast + Dinner (₹800)', val: 'Breakfast+Dinner', cost: 800}, {label: 'Full package (₹1500)', val: 'Full', cost: 1500}],
                step: 'meal_plan'
            }]);
        }

        if (step === 'meal_plan') {
            const newState = { ...postBookingFlow, selections: { ...postBookingFlow?.selections, mealPlan: { mealPlan: option.val, cost: option.cost } } };
            const seatExtra = Number(newState.selections?.seatExtra) || 0;
            const addonsTotal = (newState.selections?.addons || []).reduce((sum, a) => sum + Number(a.cost), 0);
            const basePrice = Number(newState.basePrice) || 0;
            const transportCost = (Number(newState.selections?.transport?.cost) || Number(newState.selections?.transport?.price) || 0) * totalMultipliers;
            const stayCost = Number(newState.selections?.stay?.cost) || 0;
            const mealCost = (Number(newState.selections?.mealPlan?.cost) || 0) * totalMultipliers;
            
            const totalCost = basePrice + transportCost + seatExtra + addonsTotal + stayCost + mealCost;
            newState.totalCost = totalCost;
            
            setPostBookingFlow(newState);
            
            const carbonVal = newState.carbonScore || 0;
            const carbonEmoji = carbonVal >= 70 ? '🔴' : carbonVal >= 30 ? '🟡' : '🟢';
            const carbonBadge = carbonVal <= 20 ? '\n🏅 Green Traveler Badge Earned!' : '';
            
            const addonsList = (newState.selections?.addons || []).map(a => `  • ${a.name} (₹${a.cost})`).join('\n');
            
            const summary = `📋 ━━━ BOOKING SUMMARY ━━━\n\n` +
                `📍 Destination Base: ₹${basePrice}\n` +
                `👥 Traveler Profile: ${getTravelerType(travelers)} (${travelers.length} traveler(s))\n` +
                `🚀 Transport: ${newState.selections?.transport?.name} (₹${transportCost.toLocaleString()})\n` +
                `💺 Seat: ${newState.selections?.seat}${seatExtra > 0 ? ` (+₹${seatExtra})` : ''}\n` +
                (addonsList ? `🧳 Add-ons:\n${addonsList}\n` : '') +
                `🏨 Stay: ${newState.selections?.stay?.name} (₹${stayCost.toLocaleString()})\n` +
                `🍽️ Food: ${newState.selections?.foodPref} — ${newState.selections?.mealPlan?.mealPlan} (₹${mealCost.toLocaleString()})\n` +
                `\n${carbonEmoji} Carbon Footprint Score: ${carbonVal}/100${carbonBadge}\n` +
                `\n💰 ━━━ Total Cost: ₹${totalCost.toLocaleString()} ━━━`;

            setMessages(m => {
                // Prevent duplicate rendering
                if (m.length > 0 && m[m.length - 1].text && m[m.length - 1].text.includes('BOOKING SUMMARY')) {
                    return m;
                }
                return [...m, 
                    { text: summary, sender: 'bot' },
                    {
                        text: 'Do you want to proceed with payment?',
                        sender: 'bot',
                        options: [{label: '✅ Yes, Pay Now', val: 'Yes'}, {label: '❌ No, Save for Later', val: 'No'}],
                        step: 'payment_confirm'
                    }
                ];
            });
        }

        if (step === 'payment_confirm') {
            if (option.val === 'Yes') {
                setMessages(prev => [...prev, {
                    text: 'Select payment method:',
                    sender: 'bot',
                    options: [{label: 'UPI', val: 'UPI'}, {label: 'Card', val: 'Card'}],
                    step: 'payment_method'
                }]);
            } else {
                setMessages(prev => [...prev, { text: 'Booking saved as pending. You can pay later!', sender: 'bot' }]);
                finalizeBooking(postBookingFlow);
                setPostBookingFlow(null);
            }
        }

        if (step === 'payment_method') {
            const paymentMethod = option.val;
            const currentFlow = postBookingFlow;

            if (!currentFlow || !currentFlow.totalCost) {
                setMessages(prev => [...prev, { text: 'Your booking session has expired or is invalid. Please start a new booking process.', sender: 'bot' }]);
                return;
            }

            setPostBookingFlow(prev => ({ ...prev, step: 'payment_amount', selections: { ...prev?.selections, paymentMethod: paymentMethod } }));
            setMessages(prev => [...prev, { text: `Opening Razorpay for ₹${currentFlow.totalCost}...`, sender: 'bot' }]);

            // Load Razorpay SDK dynamically
            const loadRazorpay = () => {
                return new Promise((resolve) => {
                    if (window.Razorpay) return resolve(true);
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };

            (async () => {
                try {
                    const isLoaded = await loadRazorpay();
                    if (!isLoaded) {
                        setMessages(prev => [...prev, { text: 'Failed to load payment gateway. Please check your internet connection.', sender: 'bot' }]);
                        return;
                    }

                    const keyRes = await fetch('/api/get-razorpay-key');
                    const keyData = await keyRes.json();

                    const amountInPaise = Math.round(Number(postBookingFlow.totalCost) * 100);
                    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
                        throw new Error('Invalid payment amount. Please check your booking total.');
                    }
                    const payToken = localStorage.getItem('token');
                    const orderRes = await fetch('/api/create-razorpay-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(payToken && payToken !== 'null' && payToken !== 'undefined'
                                ? { Authorization: `Bearer ${payToken}` } : {})
                        },
                        // bookingId lets the server derive the payable amount itself
                        body: JSON.stringify({ amount: amountInPaise, bookingId: currentFlow.bookingId })
                    });
                    const order = await orderRes.json();
                    if (!orderRes.ok) throw new Error(order.error || 'Order creation failed');

                    const options = {
                        key: keyData.key,
                        amount: order.amount,
                        currency: 'INR',
                        name: 'AI Tourist Assistant',
                        description: `Booking Payment`,
                        order_id: order.id,
                        handler: async function (response) {
                            try {
                                const verifyRes = await fetch('/api/verify-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_signature: response.razorpay_signature,
                                        amount: order.amount,
                                        email: formData.email || 'user@example.com',
                                        method: paymentMethod
                                    })
                                });
                                const verifyData = await verifyRes.json();
                                if (verifyData.success) {
                                    const newMsgs = [
                                        { text: 'Payment successful! 🎉 Your booking is confirmed.', sender: 'bot' },
                                        {
                                            text: 'Have a great trip! We will send you a link to review your experience after your trip ends.',
                                            sender: 'bot'
                                        }
                                    ];
                                    setMessages(prev => [...prev, ...newMsgs]);
                                    setPostBookingFlow(prev => ({ ...prev, step: 'complete', selections: { ...prev.selections, paymentAmount: postBookingFlow.totalCost } }));
                                } else {
                                    setMessages(prev => [...prev, { text: 'Payment verification failed. Please try again.', sender: 'bot' }]);
                                }
                            } catch (err) {
                                console.error('Verification error', err);
                                setMessages(prev => [...prev, { text: 'Payment verification error. Please contact support.', sender: 'bot' }]);
                            }
                        },
                        prefill: {
                            name: travelers[0]?.name || '',
                            email: travelers[0]?.email || '',
                        },
                        theme: { color: '#10b981' }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        setMessages(prev => [...prev, { text: `Payment failed: ${response.error.description}. Please try again.`, sender: 'bot' }]);
                    });
                    rzp.open();
                } catch (err) {
                    console.error('Razorpay error:', err);
                    setMessages(prev => [...prev, { text: `Payment error: ${err.message}. Please try again.`, sender: 'bot' }]);
                }
            })();
        }
    };

    const finalizeBooking = async (flowState) => {
        try {
            const payload = {
                transport: flowState.selections.transport ? {
                    ...flowState.selections.transport,
                    price: (Number(flowState.selections.transport.cost) || Number(flowState.selections.transport.price) || 0) * totalMultipliers
                } : null,
                stay: flowState.selections.stay,
                food: flowState.selections.foodPref ? {
                    preference: flowState.selections.foodPref,
                    mealPlan: flowState.selections.mealPlan.mealPlan,
                    cost: (Number(flowState.selections.mealPlan.cost) || 0) * totalMultipliers
                } : null,
                totalCost: flowState.totalCost,
                payment: flowState.selections.paymentMethod ? { method: flowState.selections.paymentMethod, amount: flowState.totalCost, status: 'Success' } : null,
                review: flowState.selections.reviewRating ? { rating: flowState.selections.reviewRating, comment: flowState.selections.reviewComment } : null,
                travelers: travelers.map(t => ({
                    name: t.name,
                    age: parseInt(t.age) || 0,
                    gender: t.gender,
                    mobile: t.mobile,
                    email: t.email,
                    ageCategory: getAgeCategory(t.age),
                    profileType: getTravelerProfile(t),
                    specialRequirements: t.specialRequirements
                })),
                travelerType: getTravelerType(travelers),
                pricingBreakdown: {
                    basePrice: flowState.basePrice / totalMultipliers,
                    totalMultipliers: totalMultipliers,
                    finalBasePrice: flowState.basePrice,
                    transportCost: (Number(flowState.selections.transport?.cost) || Number(flowState.selections.transport?.price) || 0) * totalMultipliers,
                    stayCost: Number(flowState.selections.stay?.cost) || 0,
                    foodCost: (Number(flowState.selections.mealPlan?.cost) || 0) * totalMultipliers
                }
            };
            const completeToken = localStorage.getItem('token');
            const completeConfig = (completeToken && completeToken !== 'null' && completeToken !== 'undefined')
                ? { headers: { Authorization: `Bearer ${completeToken}` } }
                : {};
            await axios.put(`/api/bookings/${flowState.bookingId}/complete`, payload, completeConfig);
            setPendingBookings(prev => [...prev, flowState.bookingId]);
        } catch (err) {
            console.error('Failed to finalize booking details');
        }
    };

    const handleExternalFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setExternalBookingData(prev => ({ ...prev, [field]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const submitExternalBooking = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = (token && token !== 'null' && token !== 'undefined') ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const payload = {
                name: currentUser === 'guest' ? 'Guest User' : currentUser,
                email: 'external@booking.com',
                travelDate: new Date(),
                numberOfPeople: 1,
                fromCity: originCity || 'Unknown',
                destination: bookingChoice._id || bookingChoice.id || 'dynamic_' + Date.now(),
                destinationObj: (!bookingChoice._id || bookingChoice._id.toString().startsWith('dynamic_')) ? bookingChoice : null,
                externalBooking: true,
                pnr: externalBookingData.pnr,
                bookingReference: externalBookingData.bookingReference,
                ticketData: externalBookingData.ticketFile,
                screenshotData: externalBookingData.screenshotFile,
                status: 'Confirmed',
                paymentStatus: 'Success',
                totalCost: bookingChoice.price
            };
            
            await axios.post('/api/bookings', payload, config);
            
            setPostExternalBooking(false);
            setBookingChoice(null);
            setExternalBookingData({ pnr: '', bookingReference: '', ticketFile: '', screenshotFile: '', showForm: false });
            
            setMessages(prev => [...prev, { text: '🎉 Amazing! Your external booking details have been successfully saved to your My Trips dashboard!', sender: 'bot' }]);
            
        } catch (err) {
            console.error('Failed to submit external booking', err);
            alert('Failed to save external booking details. Please try again.');
        }
    };
    
    const submitCommunityPlace = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = (token && token !== 'null' && token !== 'undefined') ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await axios.post('/api/community/submit', communityFormData, config);
            setShowCommunityModal(false);
            setCommunityFormData({ placeName: '', description: '', category: 'hidden-gem', location: '', image: null });
            setMessages(prev => [...prev, { text: '🌟 Thank you for submitting a hidden gem! Our AI will learn from it once it is approved.', sender: 'bot' }]);
        } catch (err) {
            console.error('Failed to submit community place', err);
            alert('Failed to submit. Please log in or try again.');
        }
    };

    return (
        <div className="flex-responsive" style={{ gap: '20px', width: '100%', height: 'calc(100vh - 100px)' }}>
            {/* ChatGPT-style Saved Chats left sidebar */}
            <div className="admin-sidebar" style={{ 
                flex: '1 1 260px', 
                maxWidth: '260px',
                minWidth: '260px',
                display: 'flex', 
                flexDirection: 'column', 
                background: 'rgba(15, 23, 42, 0.98)', 
                borderRight: '1px solid var(--border)', 
                borderRadius: '16px', 
                padding: '15px', 
                height: '100%',
                color: 'white',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* New Chat Button */}
                <button 
                    onClick={startNewChat}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'transparent',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        marginBottom: '15px',
                        width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <Plus size={18} /> New Chat
                </button>

                <button 
                    onClick={() => setShowCommunityModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: 'black',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        marginBottom: '15px',
                        width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                    🌍 Submit Hidden Gem
                </button>

                {/* Search Box */}
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'rgba(255, 255, 255, 0.4)' }} />
                    <input 
                        type="text"
                        placeholder="Search chats..."
                        value={chatSearch}
                        onChange={e => setChatSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 35px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: '13px',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px', padding: '15px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: '700', marginBottom: '4px' }}>Voice Assistant</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{voiceSettings.speakerOn ? 'Speaker ON' : 'Speaker OFF'}</div>
                        </div>
                        <button
                            className="btn"
                            onClick={handleSpeakerToggle}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 14px',
                                borderRadius: '999px',
                                background: voiceSettings.speakerOn ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer'
                            }}
                        >
                            {voiceSettings.speakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            {voiceSettings.speakerOn ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <button
                        className="btn"
                        onClick={() => setShowVoiceSettings(prev => !prev)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontWeight: '600'
                        }}
                    >
                        <Settings size={16} /> Voice Settings
                    </button>
                    {showVoiceSettings && (
                        <div style={{ marginTop: '15px', display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn"
                                    onClick={() => handleVoicePreferenceChange('voiceGender', 'female')}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: voiceSettings.voiceGender === 'female' ? 'rgba(96,165,250,0.16)' : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'white'
                                    }}
                                >Female</button>
                                <button
                                    className="btn"
                                    onClick={() => handleVoicePreferenceChange('voiceGender', 'male')}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: voiceSettings.voiceGender === 'male' ? 'rgba(96,165,250,0.16)' : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'white'
                                    }}
                                >Male</button>
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Speech Speed</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Slow', 'Normal', 'Fast'].map(speed => {
                                        const value = speed === 'Slow' ? 0.9 : speed === 'Fast' ? 1.2 : 1.0;
                                        const active = voiceSettings.speechSpeed === value;
                                        return (
                                            <button
                                                key={speed}
                                                className="btn"
                                                onClick={() => handleVoicePreferenceChange('speechSpeed', value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    background: active ? 'rgba(96,165,250,0.16)' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    color: 'white'
                                                }}
                                            >{speed}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat History List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                    {loadingChats ? (
                        <div style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontSize: '13px', marginTop: '20px' }}>Loading conversations...</div>
                    ) : chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase())).length > 0 ? (
                        chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase())).map((chat) => (
                            <div 
                                key={chat._id}
                                onClick={() => openChat(chat._id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: currentChatId === chat._id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onMouseEnter={e => {
                                    if (currentChatId !== chat._id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                }}
                                onMouseLeave={e => {
                                    if (currentChatId !== chat._id) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '80%', overflow: 'hidden' }}>
                                    <MessageSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    {renamingChatId === chat._id ? (
                                        <input 
                                            type="text"
                                            value={renameTitleInput}
                                            onChange={e => setRenameTitleInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') renameChat(chat._id); }}
                                            onBlur={() => renameChat(chat._id)}
                                            autoFocus
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                color: 'white',
                                                fontSize: '13px',
                                                padding: '2px 5px',
                                                width: '100%'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {chat.title}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                                {new Date(chat.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {renamingChatId !== chat._id && (
                                        <>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setRenamingChatId(chat._id); setRenameTitleInput(chat.title); }}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: '2px' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(chat._id); }}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: '2px' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontSize: '13px', marginTop: '20px' }}>
                            {currentUser === 'guest' ? 'Sign in to save and sync chats!' : 'No conversations found'}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Popup */}
                {deleteConfirmId && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '15px',
                        right: '15px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 10
                    }}>
                        <p style={{ fontSize: '12px', color: 'white', margin: '0 0 10px 0', textAlign: 'center' }}>Delete this conversation?</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => deleteChat(deleteConfirmId)}
                                style={{ flex: 1, padding: '5px', borderRadius: '4px', background: 'var(--danger)', border: 'none', color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setDeleteConfirmId(null)}
                                style={{ flex: 1, padding: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {(() => {
                window.renderDestinationBubbleCard = (dest, isTravelCard = false) => {
                    if (!dest || typeof dest !== 'object') return null;
                    const title = (isTravelCard ? dest.place_name || dest.name : dest.name || dest.place_name) || 'Destination';
                    const location = typeof dest.location === 'string' ? dest.location : (dest.location?.name || 'India');
                    const category = typeof dest.category === 'string' ? dest.category : (Array.isArray(dest.category) ? dest.category.join(', ') : 'Destination');
                    const rating = typeof dest.rating === 'string' || typeof dest.rating === 'number' ? String(dest.rating) : '4.5';
                    const reviews = typeof dest.reviews === 'string' ? dest.reviews : (Array.isArray(dest.reviews) ? `${dest.reviews.length} reviews` : 'Popular');
                    const bestTime = typeof dest.best_time === 'string' ? dest.best_time : (typeof dest.bestTime === 'string' ? dest.bestTime : 'Year-round');
                    
                    let weatherText = 'Pleasant, Sunny';
                    if (dest.weather) {
                        if (typeof dest.weather === 'string') {
                            weatherText = dest.weather;
                        } else if (typeof dest.weather === 'object') {
                            weatherText = `${dest.weather.temperature || '25-30°C'}, ${dest.weather.condition || 'Sunny'}`;
                        }
                    }

                    const description = typeof dest.description === 'string' ? dest.description : String(dest.description || '');
                    
                    let budgetsToRender = {
                        "1 day": `₹${Math.round((Number(dest.price) || 8000) * 0.45).toLocaleString('en-IN')}`,
                        "3 days": `₹${Math.round((Number(dest.price) || 8000) * 1.2).toLocaleString('en-IN')}`,
                        "1 week": `₹${Math.round((Number(dest.price) || 8000) * 3.1).toLocaleString('en-IN')}`
                    };

                    if (dest.budgets && typeof dest.budgets === 'object' && !Array.isArray(dest.budgets) && Object.keys(dest.budgets).length > 0) {
                        const formattedBudgets = {};
                        for (const [key, val] of Object.entries(dest.budgets)) {
                            const label = key.replace(/_/g, ' ');
                            if (typeof val === 'object' && val !== null) {
                                formattedBudgets[label] = val.total ? `₹${val.total}` : (val.cost ? `₹${val.cost}` : JSON.stringify(val));
                            } else {
                                formattedBudgets[label] = String(val);
                            }
                        }
                        if (Object.keys(formattedBudgets).length > 0) {
                            budgetsToRender = formattedBudgets;
                        }
                    }

                    const handleExploreClick = () => {
                        const baseObj = isTravelCard ? dest : {
                            place_name: dest.name || 'Destination',
                            location: location,
                            category: category,
                            description: description,
                            image_url: dest.imageUrl || dest.image_url,
                            price: dest.price || 5000,
                            rating: rating,
                            reviews: reviews,
                            best_time: bestTime,
                            weather: weatherText,
                            entry_fee: dest.entryFee || dest.entry_fee || 'Varies',
                            map_url: dest.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`,
                            hotels: dest.hotels || [],
                            foods: dest.foods || [],
                            nearby_attractions: dest.nearbyAttractions || dest.nearby_attractions || [],
                            tags: dest.tags || [category],
                            budgets: budgetsToRender,
                            itinerary: dest.itinerary || [],
                            transport_options: dest.transport_options || [],
                            packing_list: dest.packing_list || [],
                            _id: dest._id
                        };
                        
                        setDetailPage({
                            ...baseObj,
                            place_name: baseObj.place_name || title,
                            image_url: dest.image_url || dest.imageUrl,
                            image_gallery: Array.isArray(dest.image_gallery) ? dest.image_gallery : [dest.image_url || dest.imageUrl],
                            distance: dest.distance || baseObj.distance || 'Varies',
                            attractions: Array.isArray(dest.top_attractions) ? dest.top_attractions.map(a => typeof a === 'string' ? {name: a} : a) : (Array.isArray(dest.attractions) ? dest.attractions : (baseObj.attractions || [])),
                            travel_tips: Array.isArray(dest.travel_tips) ? dest.travel_tips : (baseObj.travel_tips || []),
                            safety_tips: Array.isArray(dest.safety_tips) ? dest.safety_tips : (baseObj.safety_tips || []),
                            foods: Array.isArray(dest.foods) ? dest.foods : (baseObj.foods || []),
                            nearby_attractions: Array.isArray(dest.nearby_attractions) ? dest.nearby_attractions : (baseObj.nearby_attractions || []),
                            itinerary_1_day: Array.isArray(dest.itinerary_1_day) ? dest.itinerary_1_day : (baseObj.itinerary_1_day || []),
                            itinerary_2_day: Array.isArray(dest.itinerary_2_day) ? dest.itinerary_2_day : (baseObj.itinerary_2_day || []),
                            itinerary_3_day: Array.isArray(dest.itinerary_3_day) ? dest.itinerary_3_day : (baseObj.itinerary_3_day || []),
                            reviews: Array.isArray(dest.reviews) ? dest.reviews : (baseObj.reviews || [])
                        });
                    };

                    const rawImageUrl = isTravelCard ? (dest.image_url || dest.imageUrl) : (dest.imageUrl || dest.image_url);
                    const fallbackImageUrl = "";
                    const imageUrl = rawImageUrl || fallbackImageUrl;

                    return (
                        <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(10,15,30,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', transition: 'all 0.3s', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {imageUrl && (
                                <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '5px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                                    <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImageUrl; }} />
                                </div>
                            )}
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'white' }}>{title}</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                                {description}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🌏</span> <strong>Location:</strong> {location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🏷️</span> <strong>Category:</strong> {category}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⭐</span> <strong>Rating:</strong> {rating} ({reviews})
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>📅</span> <strong>Best Time:</strong> {bestTime}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                                    <span>🌤️</span> <strong>Weather:</strong> {weatherText}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                    💰 Estimated Budgets
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {Object.entries(budgetsToRender).map(([days, cost]) => (
                                        <span key={days} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', color: '#e2e8f0' }}>
                                            {days.replace(/_/g, ' ')}: <strong style={{ color: '#10b981' }}>{typeof cost === 'object' ? JSON.stringify(cost) : String(cost)}</strong>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="btn btn-accent"
                                style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 15px rgba(16,185,129,0.35)', transition: 'all 0.2s', cursor: 'pointer', marginTop: '10px' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.35)'; }}
                                onClick={handleExploreClick}
                            >
                                🗺️ Explore Destination
                            </button>

                            {dest.nearby_places && Array.isArray(dest.nearby_places) && dest.nearby_places.length > 0 && (
                                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📍 Nearby Places You May Like
                                    </h4>
                                    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                                        {dest.nearby_places.map((np, i) => (
                                            <div key={i} style={{ minWidth: '220px', maxWidth: '220px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ height: '120px', width: '100%', background: '#1e293b' }}>
                                                    <img src={np.image_url || 'https://placehold.co/400x300?text=Image+Not+Found'} alt={np.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found'; }} />
                                                </div>
                                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                                    <h5 style={{ margin: '0 0 5px 0', fontSize: '15px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{np.name}</h5>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--accent)', marginBottom: '8px' }}>
                                                        <span>📍 {np.distance}</span>
                                                        <span>⭐ {np.rating}</span>
                                                    </div>
                                                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                                                        {np.description}
                                                    </p>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                                                        🗓️ Best Time: {np.best_time}
                                                    </div>
                                                    <button 
                                                        className="btn btn-accent" 
                                                        style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
                                                        onClick={() => handleSend(np.name)}
                                                    >
                                                        Explore
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                };
            })()}

            <div className="glass-panel chatbot-container" style={{ flex: '1', position: 'relative' }}>
                {detailPage ? (
                    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
                        <button className="btn" onClick={() => setDetailPage(null)} style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                            ← Back to Chat
                        </button>
                        
                        <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', height: '300px', marginBottom: '20px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                            <img src={detailPage.image_url} alt={detailPage.place_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '20px' }}>
                                <h2 style={{ margin: 0, fontSize: '32px', color: 'white' }}>{detailPage.place_name}</h2>
                                <p style={{ margin: '5px 0 0 0', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent)' }}><MapPin size={18}/> {detailPage.location}</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>About</h4>
                            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>{detailPage.description}</p>
                        </div>

                        {/* Image Gallery */}
                        {detailPage.image_gallery && detailPage.image_gallery.length > 1 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>📸 Photo Gallery</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                                    {detailPage.image_gallery.map((img, i) => (
                                        <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', height: '120px' }}>
                                            <img src={img} alt={`${detailPage.place_name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                                onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                                                onMouseOut={e => e.target.style.transform = 'scale(1)'}
                                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Info Cards */}
                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>📋 Key Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                                {[
                                    { icon: '📍', label: 'Distance', value: detailPage.distance || 'Varies' },
                                    { icon: '🗓️', label: 'Best Time', value: detailPage.best_time || 'Year-round' },
                                    { icon: '🎟️', label: 'Entry Fee', value: detailPage.entry_fee || 'Varies' },
                                    { icon: '⭐', label: 'Rating', value: detailPage.rating || '4.5 / 5' },
                                    { icon: '💰', label: 'Budget/Day', value: detailPage.budgets?.['1_day'] || detailPage.price ? `₹${detailPage.price?.toLocaleString('en-IN') || ''}` : 'Ask us!' },
                                    { icon: '🏷️', label: 'Category', value: detailPage.category || 'General' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{item.label}</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Attractions */}
                        {detailPage.attractions && detailPage.attractions.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🏛️ Top Attractions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {detailPage.attractions.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '20px', flexShrink: 0 }}>{a.icon || '🎯'}</span>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>{a.name}</div>
                                                {a.description && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{a.description}</div>}
                                                {a.entry_fee && <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}>🎟️ {a.entry_fee}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {detailPage.hotels && detailPage.hotels.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🏨 Recommended Hotels</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                    {detailPage.hotels.map((h, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '15px' }}>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>{h.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '4px' }}>⭐ {h.rating || 'N/A'} · {h.type || 'Hotel'}</div>
                                            {h.price_per_night && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>💰 {h.price_per_night}/night</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Local Food */}
                        {detailPage.foods && detailPage.foods.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🍽️ Local Food & Cuisine</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {detailPage.foods.map((food, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{food.icon || '🍴'}</span>
                                            <span style={{ fontWeight: '600' }}>{food.name || food}</span>
                                            {food.description && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>— {food.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Travel Tips */}
                        {detailPage.travel_tips && detailPage.travel_tips.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>💡 Travel Tips</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {detailPage.travel_tips.map((tip, i) => (
                                        <li key={i} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Safety Tips */}
                        {detailPage.safety_tips && detailPage.safety_tips.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', borderLeft: '3px solid #f59e0b' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>⚠️ Safety Tips</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {detailPage.safety_tips.map((tip, i) => (
                                        <li key={i} style={{ color: '#fbbf24', fontSize: '14px', lineHeight: '1.5' }}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Nearby Attractions */}
                        {detailPage.nearby_attractions && detailPage.nearby_attractions.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🗺️ Nearby Attractions</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {detailPage.nearby_attractions.map((place, i) => {
                                        const placeName = typeof place === 'string' ? place : place.name;
                                        return (
                                            <button 
                                                key={i} 
                                                onClick={() => handleSend(placeName)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                                style={{ 
                                                    background: 'rgba(99,102,241,0.15)', 
                                                    color: '#a5b4fc', 
                                                    border: '1px solid rgba(99,102,241,0.3)', 
                                                    borderRadius: '20px', 
                                                    padding: '6px 14px', 
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span>📍 {placeName}</span>
                                                {place.distance && <span style={{ opacity: 0.7 }}> · {place.distance}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 1/2/3 Day Itinerary Tabs */}
                        {(detailPage.itinerary_1_day?.length > 0 || detailPage.itinerary_2_day?.length > 0 || detailPage.itinerary_3_day?.length > 0 || detailPage.itinerary?.length > 0) && (
                            <div style={{ marginBottom: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid var(--border)', padding: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>🗓️ Day-wise Itinerary</h4>
                                {/* Tab Buttons */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                                    {[1,2,3].map(day => {
                                        const key = day === 1 ? 'itinerary_1_day' : day === 2 ? 'itinerary_2_day' : 'itinerary_3_day';
                                        const has = detailPage[key]?.length > 0 || detailPage.itinerary?.length > 0;
                                        return (
                                            <button key={day} onClick={() => setItineraryTab(day)}
                                                style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                                                    background: itineraryTab === day ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                                    color: itineraryTab === day ? '#0a0e1a' : 'var(--text-muted)',
                                                    opacity: has ? 1 : 0.35 }}>
                                                {day} Day{day > 1 ? 's' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Tab Content */}
                                {(() => {
                                    const key = itineraryTab === 1 ? 'itinerary_1_day' : itineraryTab === 2 ? 'itinerary_2_day' : 'itinerary_3_day';
                                    const days = detailPage[key]?.length > 0 ? detailPage[key] : detailPage.itinerary;
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(days || []).map((dayPlan, i) => (
                                                <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderLeft: '3px solid var(--accent)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>Day {dayPlan.day || i+1}</strong>
                                                        {dayPlan.title && <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{dayPlan.title}</span>}
                                                    </div>
                                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                                                        {(dayPlan.activities || []).map((act, idx) => <li key={idx} style={{ marginBottom: '6px' }}>{act}</li>)}
                                                    </ul>
                                                    {dayPlan.meals && <div style={{ marginTop: '8px', fontSize: '12px', color: '#fbbf24' }}>🍽️ {Array.isArray(dayPlan.meals) ? dayPlan.meals.join(' · ') : dayPlan.meals}</div>}
                                                    {dayPlan.accommodation && <div style={{ fontSize: '12px', color: '#a5b4fc' }}>🏨 {dayPlan.accommodation}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Guest Reviews */}
                        {detailPage.reviews && Array.isArray(detailPage.reviews) && detailPage.reviews.length > 0 && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>⭐ Guest Reviews</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {detailPage.reviews.map((rev, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong style={{ color: 'var(--text-main)' }}>{rev.reviewer || rev.name || 'Traveler'}</strong>
                                                <span style={{ color: '#fbbf24', fontSize: '14px' }}>{'⭐'.repeat(Math.round(rev.rating || 5))}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{rev.comment || rev.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🌤️ Weather Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <h5 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>Live Weather</h5>
                                    {realtimeData ? (
                                        <div style={{ fontSize: '15px' }}>
                                            <p style={{ margin: '5px 0' }}><strong>Temperature:</strong> {realtimeData.temp}°C</p>
                                            <p style={{ margin: '5px 0' }}><strong>Wind Speed:</strong> {realtimeData.wind} km/h</p>
                                        </div>
                                    ) : <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Fetching live weather...</p>}
                                </div>
                                <div>
                                    <h5 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>General Weather Forecast</h5>
                                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)' }}>
                                        {typeof detailPage.weather === 'string' ? detailPage.weather : `${detailPage.weather?.temperature || 'Pleasant'}, ${detailPage.weather?.condition || 'Sunny'}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🗺️ Interactive Map</h4>
                            <div style={{ width: '100%', height: '350px', borderRadius: '10px', overflow: 'hidden' }}>
                                <iframe 
                                    title="destination-map"
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    scrolling="no" 
                                    marginHeight="0" 
                                    marginWidth="0" 
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(detailPage.place_name)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                ></iframe>
                            </div>
                        </div>

                        {/* Official Tourism Website Explore Link */}
                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', background: 'rgba(255,255,255,0.02)' }}>
                            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🔗 Official Tourism & Information Website</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
                                <a 
                                    href={detailPage.explore_links?.tourism_website || `https://en.wikipedia.org/wiki/${encodeURIComponent(detailPage.place_name)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn btn-accent" 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold' }}
                                >
                                    🏛️ Visit Official Tourism Site
                                </a>
                                <a 
                                    href={detailPage.explore_links?.google_maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailPage.place_name)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn" 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold' }}
                                >
                                    🗺️ View on Google Maps
                                </a>
                            </div>
                        </div>

                        {detailPage.itinerary && detailPage.itinerary.length > 0 && (
                            <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                                        🗓️ Suggested Day-wise Itinerary
                                    </h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {detailPage.itinerary.map((dayPlan, i) => (
                                        <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>Day {dayPlan.day}</strong>
                                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{dayPlan.title}</span>
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                                {dayPlan.activities?.map((act, idx) => <li key={idx} style={{ marginBottom: '8px' }}>{act}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="btn btn-accent" style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold' }} 
                            onClick={() => {
                                const rawBudgetText = detailPage.budgets?.['1_day'] || '';
                                const budgetNumbers = Array.from(rawBudgetText.matchAll(/[\d,]+/g))
                                    .map(match => parseInt(match[0].replace(/,/g, ''), 10))
                                    .filter(num => Number.isFinite(num));
                                const calculatedPrice = budgetNumbers.length === 0
                                    ? 5000
                                    : budgetNumbers.length === 1
                                        ? budgetNumbers[0]
                                        : Math.round((budgetNumbers[0] + budgetNumbers[1]) / 2);
                                setBookingChoice({ ...detailPage, name: detailPage.place_name, price: calculatedPrice, _id: 'dynamic_' + Date.now() });
                            }}>
                            💳 Proceed to Book
                        </button>

                        {/* Booking Choice Modal */}
                        {bookingChoice && !showExternalLinks && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                <div className="glass-panel" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '30px', borderRadius: '20px', maxWidth: '700px', width: '100%', position: 'relative' }}>
                                    <button onClick={() => setBookingChoice(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                    <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '22px', color: 'white' }}>
                                        Great choice! How would you like to book your trip to {bookingChoice.name}?
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {/* Internal Booking Option */}
                                        <div style={{ border: '2px solid var(--accent)', borderRadius: '15px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(16, 185, 129, 0.05)' }}>
                                            <div style={{ fontSize: '40px', textAlign: 'center' }}>🤖</div>
                                            <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: 'white' }}>Book on Our Website</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <li>Complete booking inside my platform</li>
                                                <li>AI-generated itinerary</li>
                                                <li>Booking history</li>
                                                <li>Saved trips</li>
                                                <li>Budget tracking</li>
                                                <li>Travel companion support</li>
                                                <li>Download itinerary PDF</li>
                                            </ul>
                                            <button className="btn btn-accent" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }} onClick={() => {
                                                setBookingForm({ destination: bookingChoice });
                                                setBookingChoice(null);
                                                setDetailPage(null);
                                            }}>
                                                Continue Booking
                                            </button>
                                        </div>
                                        {/* External Links Option */}
                                        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                            <div style={{ fontSize: '40px', textAlign: 'center' }}>🌍</div>
                                            <h4 style={{ margin: 0, textAlign: 'center', fontSize: '18px', color: 'white' }}>Official Booking Websites</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <li>Fill your details once</li>
                                                <li>Saved to your booking history</li>
                                                <li>Choose from real providers</li>
                                                <li>Real-time availability & discounts</li>
                                            </ul>
                                            <button className="btn" style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} onClick={() => { setOfficialBookingStep('form'); setShowExternalLinks(true); }}>
                                                Fill Details & Choose Provider
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* External Links Modal - Two Step: Form → Providers */}
                        {showExternalLinks && bookingChoice && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                <div className="glass-panel" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '30px', borderRadius: '20px', maxWidth: '640px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                                    <button onClick={() => { setShowExternalLinks(false); setBookingChoice(null); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✖</button>

                                    {officialBookingStep === 'form' ? (
                                        <>
                                            <h3 style={{ margin: '0 0 6px 0', textAlign: 'center', fontSize: '22px', color: 'white' }}>
                                                ✈️ Traveller Details
                                            </h3>
                                            <p style={{ margin: '0 0 22px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                Your details will be saved before you're redirected to the booking site.
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                {[
                                                    { label: 'Traveller Name', key: 'name', type: 'text', placeholder: 'Full Name' },
                                                    { label: 'Age', key: 'age', type: 'number', placeholder: 'Age' },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>{f.label}</label>
                                                        <input type={f.type} placeholder={f.placeholder} value={officialBookingFormData[f.key]} onChange={e => setOfficialBookingFormData(p => ({...p, [f.key]: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Gender</label>
                                                    <select value={officialBookingFormData.gender} onChange={e => setOfficialBookingFormData(p => ({...p, gender: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                                        <option>Male</option><option>Female</option><option>Other</option>
                                                    </select>
                                                </div>
                                                {[
                                                    { label: 'Email', key: 'email', type: 'email', placeholder: 'your@email.com' },
                                                    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>{f.label}</label>
                                                        <input type={f.type} placeholder={f.placeholder} value={officialBookingFormData[f.key]} onChange={e => setOfficialBookingFormData(p => ({...p, [f.key]: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Departure City</label>
                                                    <input type="text" placeholder="Bangalore" value={officialBookingFormData.fromCity} onChange={e => setOfficialBookingFormData(p => ({...p, fromCity: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Destination</label>
                                                    <input type="text" readOnly value={bookingChoice.name} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'not-allowed', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Travel Date</label>
                                                    <input type="date" value={officialBookingFormData.travelDate} onChange={e => setOfficialBookingFormData(p => ({...p, travelDate: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Return Date</label>
                                                    <input type="date" value={officialBookingFormData.returnDate} onChange={e => setOfficialBookingFormData(p => ({...p, returnDate: e.target.value}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Adults</label>
                                                    <input type="number" min="1" max="20" value={officialBookingFormData.adults} onChange={e => setOfficialBookingFormData(p => ({...p, adults: parseInt(e.target.value) || 1}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Children</label>
                                                    <input type="number" min="0" max="20" value={officialBookingFormData.children} onChange={e => setOfficialBookingFormData(p => ({...p, children: parseInt(e.target.value) || 0}))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                                </div>
                                            </div>
                                            <button className="btn btn-accent" style={{ width: '100%', padding: '13px', fontSize: '16px', fontWeight: 'bold', marginTop: '8px' }}
                                                onClick={async () => {
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const config = (token && token !== 'null' && token !== 'undefined') ? { headers: { Authorization: `Bearer ${token}` } } : {};
                                                        const payload = {
                                                            name: officialBookingFormData.name,
                                                            age: officialBookingFormData.age,
                                                            gender: officialBookingFormData.gender,
                                                            email: officialBookingFormData.email,
                                                            phone: officialBookingFormData.phone,
                                                            fromCity: officialBookingFormData.fromCity,
                                                            toCity: bookingChoice.name,
                                                            travelDate: officialBookingFormData.travelDate || new Date().toISOString().split('T')[0],
                                                            returnDate: officialBookingFormData.returnDate,
                                                            adults: officialBookingFormData.adults,
                                                            children: officialBookingFormData.children,
                                                            numberOfPeople: (officialBookingFormData.adults || 1) + (officialBookingFormData.children || 0),
                                                            destination: bookingChoice._id || bookingChoice.id || 'dynamic_' + Date.now(),
                                                            destinationObj: (!bookingChoice._id || bookingChoice._id.toString().startsWith('dynamic_')) ? bookingChoice : null,
                                                            bookingType: 'Official',
                                                            bookingStatus: 'Redirected',
                                                            totalCost: bookingChoice.price || 5000,
                                                            travelers: [{ name: officialBookingFormData.name, age: officialBookingFormData.age, gender: officialBookingFormData.gender, email: officialBookingFormData.email, mobile: officialBookingFormData.phone }]
                                                        };
                                                        await axios.post('/api/bookings', payload, config);
                                                    } catch(err) {
                                                        console.warn('Official booking pre-save failed:', err.message);
                                                    }
                                                    setOfficialBookingStep('providers');
                                                }}>
                                                Save & Choose Provider →
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '22px', color: 'white' }}>
                                                Official Providers for {bookingChoice.name}
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '10px' }}>
                                                {[
                                                    { label: '✈ Flights', links: [
                                                        { name: 'IndiGo', url: 'https://www.goindigo.in/' },
                                                        { name: 'Air India', url: 'https://www.airindia.com/' },
                                                        { name: 'Akasa Air', url: 'https://www.akasaair.com/' },
                                                        { name: 'SpiceJet', url: 'https://www.spicejet.com/' },
                                                    ]},
                                                    { label: '🚆 Trains / Buses', links: [
                                                        { name: 'IRCTC', url: 'https://www.irctc.co.in/' },
                                                        { name: 'RedBus', url: 'https://www.redbus.in/' },
                                                        { name: 'AbhiBus', url: 'https://www.abhibus.com/' },
                                                    ]},
                                                    { label: '🏨 Hotels', links: [
                                                        { name: 'Booking.com', url: 'https://www.booking.com/' },
                                                        { name: 'Agoda', url: 'https://www.agoda.com/' },
                                                        { name: 'Goibibo', url: 'https://www.goibibo.com/' },
                                                    ]},
                                                    { label: '🗺️ Full Packages', links: [
                                                        { name: 'MakeMyTrip', url: 'https://www.makemytrip.com/' },
                                                        { name: 'Yatra', url: 'https://www.yatra.com/' },
                                                        { name: 'Cleartrip', url: 'https://www.cleartrip.com/' },
                                                    ]},
                                                ].map((section, si) => (
                                                    <div key={si} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                                                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>{section.label}</h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {section.links.map((link, li) => (
                                                                <a key={li} href={link.url} target="_blank" rel="noreferrer"
                                                                    style={{ display: 'block', padding: '9px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', textDecoration: 'none', fontSize: '14px', fontWeight: '600', transition: 'background 0.2s' }}
                                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}>
                                                                    {link.name} ↗
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                                <button className="btn" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none' }} onClick={() => setOfficialBookingStep('form')}>← Back to Form</button>
                                                <button className="btn btn-accent" style={{ flex: 1, padding: '12px' }} onClick={() => { setShowExternalLinks(false); setBookingChoice(null); setPostExternalBooking(true); }}>Done ✓</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Demo Booking Modal */}
                        {activeDemoProvider && bookingChoice && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                                <div className="glass-panel" style={{ background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '100%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                                    
                                    {/* Close Button */}
                                    <button onClick={() => setActiveDemoProvider(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                    
                                    {/* Academic Badge */}
                                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        🛡️ Demo Provider - For Academic Project Demonstration
                                    </div>

                                    {/* Web Browser URL bar */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                                        <span style={{ color: '#10b981' }}>🔒 Secure</span>
                                        <span style={{ color: '#334155' }}>|</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://www.demo-{activeDemoProvider.name.toLowerCase().replace(/\s+/g, '')}.com/book</span>
                                    </div>

                                    {/* Screen 1: View Provider Details */}
                                    {demoBookingStep === 'view' && (
                                        <div>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'white', fontWeight: '700' }}>
                                                {activeDemoProvider.name}
                                            </h3>
                                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                                                Book your {activeDemoProvider.type === 'flight' ? 'Flight' : 'Stay'} to {bookingChoice.name} with our official partner.
                                            </p>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '18px', borderRadius: '12px', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b' }}>Destination:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{bookingChoice.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b' }}>Travel Date:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{new Date(demoBookingForm.travelDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b' }}>Price:</span>
                                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                                                        ₹{getDemoProviderPrice().toLocaleString()} {activeDemoProvider.type === 'hotel' && '/ night'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b' }}>Availability:</span>
                                                    <span style={{ color: '#34d399', fontWeight: '500' }}>
                                                        🟢 Available (9 {activeDemoProvider.type === 'flight' ? 'seats' : 'rooms'} left)
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <button className="btn btn-accent" onClick={() => setDemoBookingStep('form')} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                                                Book Now
                                            </button>
                                        </div>
                                    )}

                                    {/* Screen 2: Booking Form */}
                                    {demoBookingStep === 'form' && (
                                        <form onSubmit={submitDemoBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'white', fontWeight: '700' }}>Passenger / Guest Details</h3>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Provide information to complete the booking simulation.</p>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'left' }}>Full Name *</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    placeholder="e.g. John Doe"
                                                    value={demoBookingForm.fullName}
                                                    onChange={e => setDemoBookingForm({ ...demoBookingForm, fullName: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px' }} 
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'left' }}>Email Address *</label>
                                                <input 
                                                    type="email" 
                                                    required 
                                                    placeholder="e.g. john@example.com"
                                                    value={demoBookingForm.email}
                                                    onChange={e => setDemoBookingForm({ ...demoBookingForm, email: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px' }} 
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'left' }}>Mobile Number *</label>
                                                <input 
                                                    type="tel" 
                                                    required 
                                                    placeholder="e.g. +91 9876543210"
                                                    value={demoBookingForm.mobile}
                                                    onChange={e => setDemoBookingForm({ ...demoBookingForm, mobile: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px' }} 
                                                />
                                            </div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'left' }}>No. of {activeDemoProvider.type === 'flight' ? 'Travelers' : 'Guests'}</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        required 
                                                        value={demoBookingForm.travelers}
                                                        onChange={e => setDemoBookingForm({ ...demoBookingForm, travelers: parseInt(e.target.value) || 1 })}
                                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px' }} 
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'left' }}>Travel Date</label>
                                                    <input 
                                                        type="date" 
                                                        required 
                                                        value={demoBookingForm.travelDate}
                                                        onChange={e => setDemoBookingForm({ ...demoBookingForm, travelDate: e.target.value })}
                                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '14px' }} 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}>
                                                Confirm Booking
                                            </button>
                                        </form>
                                    )}

                                    {/* Screen 3: Demo Booking Successful */}
                                    {demoBookingStep === 'success' && demoBookingResult && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '28px', marginBottom: '16px' }}>✓</div>
                                            
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#34d399', fontWeight: '700' }}>
                                                Demo Booking Successful
                                            </h3>
                                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                                                {demoBookingResult.message}
                                            </p>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '18px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Demo Booking ID:</span>
                                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontFamily: 'monospace' }}>{demoBookingResult.id}</span>
                                                </div>
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Provider:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{activeDemoProvider.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Destination:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{bookingChoice.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Traveler Name:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{demoBookingResult.fullName}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Date:</span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{new Date(demoBookingResult.travelDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Total Paid:</span>
                                                    <span style={{ color: '#34d399', fontWeight: '700' }}>₹{demoBookingResult.totalPrice.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            
                                            <button className="btn" onClick={() => { setActiveDemoProvider(null); setShowExternalLinks(false); }} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold', background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none' }}>
                                                Close & Return
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Post-External Booking Flow */}
                        {postExternalBooking && bookingChoice && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                <div className="glass-panel" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '100%', position: 'relative' }}>
                                    <button onClick={() => { setPostExternalBooking(false); setBookingChoice(null); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                    <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '22px', color: 'white' }}>
                                        Have you completed your booking?
                                    </h3>
                                    
                                    {externalBookingData.showForm ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>Great! Please upload your tickets or provide reference details to save this trip to your dashboard.</p>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Upload PDF Ticket</label>
                                                <input type="file" accept="application/pdf" onChange={e => handleExternalFileUpload(e, 'ticketFile')} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Upload Booking Screenshot</label>
                                                <input type="file" accept="image/*" onChange={e => handleExternalFileUpload(e, 'screenshotFile')} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>PNR Number</label>
                                                <input type="text" placeholder="e.g., X1Y2Z3" value={externalBookingData.pnr} onChange={e => setExternalBookingData({...externalBookingData, pnr: e.target.value})} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label>Booking Reference Number</label>
                                                <input type="text" placeholder="e.g., MMT123456" value={externalBookingData.bookingReference} onChange={e => setExternalBookingData({...externalBookingData, bookingReference: e.target.value})} />
                                            </div>
                                            <button className="btn btn-accent" onClick={submitExternalBooking} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                                                Save Booking to My Trips
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                            <button className="btn btn-accent" onClick={() => setExternalBookingData({...externalBookingData, showForm: true})} style={{ flex: 1, padding: '12px', fontSize: '16px' }}>Yes</button>
                                            <button className="btn" onClick={() => { setPostExternalBooking(false); setBookingChoice(null); }} style={{ flex: 1, padding: '12px', fontSize: '16px', background: 'rgba(255,255,255,0.1)' }}>No</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                <>
                <div className="chat-messages">
                {messages.map((msg, i) => (
                    <motion.div key={i} className={`message ${msg.sender}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                        {msg.image && (
                            <div style={{ marginTop: '10px' }}>
                                <img src={msg.image} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                            </div>
                        )}
                        {msg.sender === 'bot' && msg.text && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button
                                    className="btn"
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '13px',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: 'var(--accent)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '999px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => handleListenClick(msg.text)}
                                >
                                    🔊 Listen
                                </button>
                            </div>
                        )}
                        {msg.options && msg.options.length > 0 && msg.step !== 'stay' && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {msg.options.map((opt, idx) => (
                                    <button key={idx} className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleOptionSelect(msg.step, opt)}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {msg.options && msg.options.length > 0 && msg.step === 'stay' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
                                {msg.options.map((opt, idx) => (
                                    <div key={idx} onClick={() => handleOptionSelect(msg.step, opt)} className="glass-panel" style={{ padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                                        {opt.hotelObj && opt.hotelObj.image_url ? (
                                            <img src={opt.hotelObj.image_url} alt={opt.hotelObj.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🏨</div>
                                        )}
                                        <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '15px' }}>{opt.hotelObj ? opt.hotelObj.name : opt.label.split('(')[0]}</h4>
                                        {opt.hotelObj && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                                    <span>⭐ {opt.hotelObj.rating} ({opt.hotelObj.reviews_count} reviews)</span>
                                                    <span style={{ textTransform: 'capitalize', color: 'var(--accent)' }}>{opt.hotelObj.type}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {opt.hotelObj.amenities.join(' • ')}
                                                </div>
                                            </>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)' }}>₹{opt.cost} <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/night</span></div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '10px' }}>Select</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {msg.data && msg.data.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                                {msg.data.map((dest, idx) => (
                                    <div key={idx}>
                                        {window.renderDestinationBubbleCard && window.renderDestinationBubbleCard(dest, false)}
                                    </div>
                                ))}
                            </div>
                        )}
                        {msg.emergency_steps && msg.emergency_steps.length > 0 && (
                            <div className="glass-panel" style={{ marginTop: '15px', padding: '20px', borderRadius: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🚨 Emergency Action Plan
                                </h3>
                                <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '15px' }}>
                                    {msg.emergency_steps.map((step, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
                                    ))}
                                </ul>
                                {msg.emergency_contacts && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)' }}>Emergency Contacts</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                            {Object.entries(msg.emergency_contacts).map(([key, val]) => (
                                                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-muted)' }}>{key}</span>
                                                    <a href={`tel:${val}`} style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none', fontSize: '16px' }}>📞 {val}</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {msg.nearby_services && msg.nearby_services.length > 0 && (
                            <div style={{ marginTop: '15px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '14px' }}>📍 Nearby Services</h4>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {msg.nearby_services.map((svc, idx) => (
                                        <div key={idx} className="glass-panel" style={{ minWidth: '160px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                                                {svc.type === 'ATM' ? '🏧' : svc.type === 'Hospital' ? '🏥' : svc.type === 'Fuel' ? '⛽' : '📍'}
                                            </div>
                                            <h5 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-main)' }}>{svc.name}</h5>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{svc.distance}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {msg.itinerary && msg.itinerary.length > 0 && (
                            <div className="itinerary-timeline" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button className="btn btn-accent" onClick={() => exportToPDF(`itinerary-${i}`, 'My_Itinerary')} style={{ alignSelf: 'flex-start', padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Download size={14}/> Export to PDF
                                </button>
                                <div id={`itinerary-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'var(--bg-main)', borderRadius: '10px' }}>
                                {msg.itinerary.map((dayPlan, idx) => (
                                    <div key={idx} className="glass-panel" style={{ padding: '15px', borderLeft: '4px solid var(--accent)', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase' }}>Day {dayPlan.day}</span>
                                            <h4 style={{ margin: 0, fontSize: '16px' }}>{dayPlan.title}</h4>
                                        </div>
                                        <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
                                            {dayPlan.activities.map((act, i) => (
                                                <li key={i} style={{ marginBottom: '5px' }}>{act}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                        {/* Destination Preview Card */}
                        {msg.action === 'DESTINATION_PREVIEW' && msg.preview_card && (
                            <div style={{ marginTop: '15px' }}>
                                {(() => {
                                    const card = msg.preview_card;
                                    const title = card.place_name || 'Destination';
                                    const location = card.location || 'India';
                                    const category = card.category || 'Destination';
                                    const rating = card.rating || '4.7';
                                    const reviewsCount = card.reviews_count || '9000';
                                    const bestTime = card.best_time || 'Year-round';
                                    
                                    let weatherText = 'Pleasant, Sunny';
                                    let currentWeather = null;
                                    let weatherForecast = [];
                                    if (card.weather) {
                                        if (typeof card.weather === 'string') {
                                            weatherText = card.weather;
                                        } else if (typeof card.weather === 'object') {
                                            if (card.weather.current) {
                                                currentWeather = card.weather.current;
                                                weatherText = `${currentWeather.temperature}, ${currentWeather.condition}, Humidity: ${currentWeather.humidity}`;
                                            } else {
                                                const temp = card.weather.temperature || '28°C';
                                                const condition = card.weather.condition || 'Sunny';
                                                const humidity = card.weather.humidity || '65%';
                                                weatherText = `${temp}, ${condition}, Humidity: ${humidity}`;
                                            }
                                            if (card.weather.forecast && Array.isArray(card.weather.forecast)) {
                                                weatherForecast = card.weather.forecast;
                                            }
                                        }
                                    }

                                    const aiDescription = card.ai_description || card.description || '';
                                    
                                    let budgetsToRender = {
                                        "1 day": card.budgets?.['1_day'] || card.budgets?.['1_day'] || `₹${Math.round((Number(card.price) || 5000) * 0.5).toLocaleString('en-IN')}`,
                                        "3 days": card.budgets?.['3_days'] || card.budgets?.['3_days'] || `₹${Math.round((Number(card.price) || 5000) * 1.5).toLocaleString('en-IN')}`,
                                        "1 week": card.budgets?.['1_week'] || card.budgets?.['1_week'] || `₹${Math.round((Number(card.price) || 5000) * 3.5).toLocaleString('en-IN')}`
                                    };

                                    const handleExploreMore = () => {
                                        const fullDest = msg.full_destination || card;
                                        setDetailPage({
                                            place_name: fullDest.place_name || title,
                                            location: fullDest.location || location,
                                            category: fullDest.category || category,
                                            description: fullDest.description || card.description,
                                            image_url: fullDest.image_url || card.image_url,
                                            image_gallery: Array.isArray(fullDest.image_gallery) ? fullDest.image_gallery : (card.image_gallery || [card.image_url]),
                                            best_time: fullDest.best_time || bestTime,
                                            weather: fullDest.weather || card.weather,
                                            distance: fullDest.distance || card.distance,
                                            price: fullDest.price || card.price,
                                            rating: fullDest.rating || rating,
                                            entry_fee: fullDest.entry_fee || 'Varies',
                                            map_url: fullDest.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`,
                                            hotels: fullDest.hotels || [],
                                            foods: fullDest.foods || [],
                                            nearby_attractions: fullDest.nearby_attractions || card.nearby_attractions || [],
                                            tags: fullDest.tags || [category],
                                            budgets: fullDest.budgets || card.budgets,
                                            itinerary: fullDest.itinerary || [],
                                            itinerary_1_day: fullDest.itinerary_1_day || [],
                                            itinerary_2_day: fullDest.itinerary_2_day || [],
                                            itinerary_3_day: fullDest.itinerary_3_day || [],
                                            transport_options: fullDest.transport_options || [],
                                            attractions: fullDest.attractions || card.attractions || [],
                                            travel_tips: fullDest.travel_tips || [],
                                            safety_tips: fullDest.safety_tips || [],
                                            reviews: fullDest.reviews || [],
                                            packing_list: fullDest.packing_list || []
                                        });
                                    };

                                    const imageUrl = card.image_url;

                                    return (
                                        <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(10,15,30,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', transition: 'all 0.3s', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {/* Hero Image */}
                                            {imageUrl && (
                                                <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                                    <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '15px' }}>
                                                        <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'white' }}>{title}</h3>
                                                        <p style={{ margin: '5px 0 0 0', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent)', fontSize: '14px' }}><MapPin size={16}/> {location}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Generated Description */}
                                            {aiDescription && (
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontStyle: 'italic' }}>
                                                        "{aiDescription}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Live Weather */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '12px', borderRadius: '10px' }}>
                                                <span style={{ fontSize: '24px' }}>🌤️</span>
                                                <div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>LIVE WEATHER</div>
                                                    <div style={{ fontSize: '15px', color: 'white', fontWeight: '700' }}>{weatherText}</div>
                                                    {currentWeather && (
                                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                                            Feels like: {currentWeather.feelsLike} | UV: {currentWeather.uvIndex}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 7-Day Weather Forecast */}
                                            {weatherForecast.length > 0 && (
                                                <div>
                                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                                                        📅 7-Day Forecast
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                                                        {weatherForecast.map((day, i) => (
                                                            <div key={i} style={{ 
                                                                background: 'rgba(255,255,255,0.05)', 
                                                                padding: '8px 12px', 
                                                                borderRadius: '8px', 
                                                                minWidth: '80px',
                                                                textAlign: 'center',
                                                                border: '1px solid rgba(255,255,255,0.08)'
                                                            }}>
                                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                                                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                                </div>
                                                                <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                                                                    {day.condition.includes('Sunny') ? '☀️' : day.condition.includes('Rain') ? '🌧️' : day.condition.includes('Cloud') ? '☁️' : '🌤️'}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>
                                                                    {day.maxTemp}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                                                                    {day.minTemp}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quick Facts */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>⭐ RATING</div>
                                                    <div style={{ color: 'white', fontWeight: '700' }}>{rating} ({reviewsCount} reviews)</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>🗓️ BEST TIME</div>
                                                    <div style={{ color: 'white', fontWeight: '700' }}>{bestTime}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>🏷️ CATEGORY</div>
                                                    <div style={{ color: 'white', fontWeight: '700' }}>{category}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>⏱️ IDEAL DURATION</div>
                                                    <div style={{ color: 'white', fontWeight: '700' }}>{card.ideal_duration || '2-3 days'}</div>
                                                </div>
                                            </div>

                                            {/* Estimated Budget */}
                                            <div>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                                    💰 Estimated Budget
                                                </h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {Object.entries(budgetsToRender).map(([days, cost]) => (
                                                        <span key={days} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: '#e2e8f0' }}>
                                                            {days.replace(/_/g, ' ')}: <strong style={{ color: '#10b981' }}>{typeof cost === 'object' ? JSON.stringify(cost) : String(cost)}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Famous For */}
                                            {card.famous_for && card.famous_for.length > 0 && (
                                                <div>
                                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                                                        ✨ Famous For
                                                    </h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {card.famous_for.slice(0, 3).map((item, i) => (
                                                            <span key={i} style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Google Maps Button */}
                                            {card.embedded_map_url && (
                                                <button
                                                    className="btn"
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '12px', 
                                                        fontSize: '14px', 
                                                        fontWeight: '600', 
                                                        borderRadius: '10px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        gap: '8px', 
                                                        background: 'rgba(66,133,244,0.15)', 
                                                        border: '1px solid rgba(66,133,244,0.3)', 
                                                        color: '#4285f4',
                                                        cursor: 'pointer',
                                                        marginTop: '5px'
                                                    }}
                                                    onClick={() => window.open(card.embedded_map_url || card.map_url, '_blank')}
                                                >
                                                    🗺️ View on Google Maps
                                                </button>
                                            )}

                                            {/* Explore More Button */}
                                            <button
                                                className="btn btn-accent"
                                                style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 15px rgba(16,185,129,0.35)', transition: 'all 0.2s', cursor: 'pointer', marginTop: '5px' }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.5)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.35)'; }}
                                                onClick={handleExploreMore}
                                            >
                                                🗺️ EXPLORE MORE
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {msg.travel_cards && msg.travel_cards.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px' }}>
                                {msg.travel_cards.map((card, idx) => (
                                    <div key={idx}>
                                        {window.renderDestinationBubbleCard && window.renderDestinationBubbleCard(card, true)}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Related Places Chips */}
                        {msg.related_places && msg.related_places.length > 0 && (
                            <div style={{ marginTop: '16px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🗺️ Related Places You Might Love</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {msg.related_places.map((place, pi) => {
                                        const placeName = typeof place === 'string' ? place : (place.name || place.title || place.place_name || '');
                                        return (
                                            <button
                                                key={pi}
                                                type="button"
                                                onClick={() => handleSend(placeName)}
                                                title={typeof place === 'object' ? place.description || place.title || '' : ''}
                                                style={{
                                                    padding: '7px 14px',
                                                    borderRadius: '20px',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    background: 'rgba(16,185,129,0.08)',
                                                    color: 'var(--accent)',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.transform = 'none'; }}
                                            >
                                                📍 {placeName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {msg.showTrips && (
                            <div style={{ marginTop: '15px' }}>
                                <TripTable 
                                    addToCart={addToCart} 
                                    onTripAdded={(trip) => {
                                        setMessages(prev => [...prev, { text: `Excellent choice! 🎒 I have added the ${trip.type} to ${trip.destination} seamlessly to your cart! You can view it by clicking the Cart icon up top.`, sender: 'bot' }]);
                                    }}
                                />
                            </div>
                        )}
                        {msg.transportSearch && (
                            <div style={{ marginTop: '15px', maxWidth: '100%' }}>
                                <TransportCards 
                                    from={msg.transportSearch.from} 
                                    to={msg.transportSearch.to} 
                                    type={msg.transportSearch.type}
                                    onBook={(transport) => {
                                        const t = { cost: transport.price, name: transport.name };
                                        setPostBookingFlow(prev => ({ ...prev, selections: { ...prev.selections, transport: t } }));
                                        setMessages(prev => [...prev, 
                                            { text: `✅ Booked: ${transport.name} — ₹${transport.price}`, sender: 'user' },
                                            {
                                                text: `Great choice! Now choose your class & seat:`,
                                                sender: 'bot',
                                                showSeatSelector: transport.type // 'flight', 'train', or 'bus'
                                            }
                                        ]);
                                    }}
                                />
                            </div>
                        )}
                        {msg.showSeatSelector && (
                            <div style={{ marginTop: '15px' }}>
                                <SeatSelector 
                                    transportType={msg.showSeatSelector}
                                    onSelect={(selection) => {
                                        handleOptionSelect('seat_selection', selection);
                                    }}
                                />
                            </div>
                        )}
                        {msg.showAddonsSelector && (
                            <div style={{ marginTop: '15px' }}>
                                <AddonsSelector 
                                    onConfirm={(selection) => {
                                        if (selection.type === 'none') {
                                            handleOptionSelect('addons', { val: 'none', cost: 0 });
                                        } else if (selection.type === 'bundle') {
                                            // Handle bundle - we can treat it as one big addon or map it
                                            setPostBookingFlow(prev => ({
                                                ...prev,
                                                selections: {
                                                    ...prev.selections,
                                                    addons: [{ name: selection.name, cost: selection.cost }]
                                                }
                                            }));
                                            handleOptionSelect('addons', { val: 'none', cost: 0 }); // Skip further additions
                                        } else {
                                            // Individual addons
                                            setPostBookingFlow(prev => ({
                                                ...prev,
                                                selections: {
                                                    ...prev.selections,
                                                    addons: selection.items
                                                }
                                            }));
                                            handleOptionSelect('addons', { val: 'none', cost: 0 });
                                        }
                                    }}
                                />
                            </div>
                        )}
                        {msg.showFeedbackForm && (
                            <div style={{ marginTop: '15px' }}>
                                <ReviewsSection 
                                    entityId={postBookingFlow?.destination?._id || postBookingFlow?.destination?.name || 'checkout'} 
                                    entityType="destination" 
                                    onReviewSubmitted={(review) => {
                                        setPostBookingFlow(prev => {
                                            const finalState = {
                                                ...prev,
                                                selections: {
                                                    ...prev.selections,
                                                    reviewRating: review.rating,
                                                    reviewComment: review.reviewText
                                                }
                                            };
                                            finalizeBooking(finalState);
                                            return null;
                                        });

                                        setMessages(prev => [...prev, {
                                            text: "🎉 Review saved! Thank you so much for your feedback!\n\nYour entire MERN travel booking package has been officially locked and confirmed. Safe travels! 🎒🌟 You can view your invoice and bookings on your dashboard.",
                                            sender: 'bot'
                                        }]);
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
                {isSending && (
                    <div className="message bot typing-indicator-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px' }}>
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Loading destination images...</span>
                    </div>
                )}
                {bookingForm && (
                    <div className="message bot" style={{ padding: '25px', borderRadius: '15px', background: 'rgba(30, 30, 45, 0.95)', border: '1px solid rgba(129, 140, 248, 0.3)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', maxWidth: '600px', width: '100%' }}>
                        <form onSubmit={submitBooking}>
                            <h3 style={{ marginBottom: '20px', fontSize: '20px', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>✈️ Boarding Ticket Booking</h3>
                            
                            <div className="form-group" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Departure Origin</label>
                                    <input type="text" placeholder="From (e.g. Bangalore)" required value={formData.fromCity} onChange={e => setFormData({ ...formData, fromCity: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destination</label>
                                    <input type="text" readOnly value={bookingForm.destination.name} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'not-allowed' }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Travel Date</label>
                                    <input type="date" required value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Travelers Count</label>
                                    <input type="number" min="1" max="10" placeholder="1" required value={formData.numberOfPeople} onChange={e => handleNumPeopleChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            {/* Travelers detail array fields */}
                            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', paddingRight: '5px' }}>
                                {travelers.map((t, idx) => {
                                    const cat = getAgeCategory(t.age);
                                    const profile = getTravelerProfile(t);
                                    const isPrimary = idx === 0;
                                    return (
                                        <div key={idx} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                                                <div>
                                                    <strong style={{ fontSize: '13px' }}>👤 Traveler #{idx + 1} {isPrimary && ' (Primary)'}</strong>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Detected profile: {profile}</div>
                                                </div>
                                                <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '8px' }}>{cat}</span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                <input type="text" placeholder="Full Name" required value={t.name} onChange={e => updateTravelerField(idx, 'name', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }} />
                                                <input type="number" placeholder="Age" min="0" required value={t.age} onChange={e => updateTravelerField(idx, 'age', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }} />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                <select value={t.gender} onChange={e => updateTravelerField(idx, 'gender', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }}>
                                                    <option value="Male" style={{color: '#000', background: '#fff'}}>Male</option>
                                                    <option value="Female" style={{color: '#000', background: '#fff'}}>Female</option>
                                                    <option value="Other" style={{color: '#000', background: '#fff'}}>Other</option>
                                                </select>
                                                <input type="tel" placeholder="Mobile Number" required={isPrimary} value={t.mobile || ''} onChange={e => updateTravelerField(idx, 'mobile', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }} />
                                            </div>

                                            <div style={{ marginBottom: '10px' }}>
                                                <input type="email" placeholder="Email Address" required={isPrimary} value={t.email || ''} onChange={e => updateTravelerField(idx, 'email', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }} />
                                            </div>

                                            {/* Special Requirements */}
                                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '12px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.wheelchair || false} onChange={e => updateTravelerRequirement(idx, 'wheelchair', e.target.checked)} />
                                                        ♿ Wheelchair
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.seniorAssistance || false} onChange={e => updateTravelerRequirement(idx, 'seniorAssistance', e.target.checked)} />
                                                        🤝 Sr. Assistance
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.pregnant || false} onChange={e => updateTravelerRequirement(idx, 'pregnant', e.target.checked)} />
                                                        🤰 Pregnant Traveler
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.medicalConditionSupport || false} onChange={e => updateTravelerRequirement(idx, 'medicalConditionSupport', e.target.checked)} />
                                                        🩺 Medical Condition Support
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.petTraveler || false} onChange={e => updateTravelerRequirement(idx, 'petTraveler', e.target.checked)} />
                                                        🐾 Pet Traveler
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.accessibleTransport || false} onChange={e => updateTravelerRequirement(idx, 'accessibleTransport', e.target.checked)} />
                                                        🚍 Accessible Transport
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.emergencySupport || false} onChange={e => updateTravelerRequirement(idx, 'emergencySupport', e.target.checked)} />
                                                        🚨 Emergency Support
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={t.specialRequirements?.extraLuggage || false} onChange={e => updateTravelerRequirement(idx, 'extraLuggage', e.target.checked)} />
                                                        🧳 Extra Luggage
                                                    </label>
                                                    <select value={t.specialRequirements?.mealPreference || 'No Preference'} onChange={e => updateTravelerRequirement(idx, 'mealPreference', e.target.value)} style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '11px', minWidth: '140px' }}>
                                                        <option value="No Preference" style={{color: '#000', background: '#fff'}}>No Preference</option>
                                                        <option value="Vegetarian" style={{color: '#000', background: '#fff'}}>Vegetarian</option>
                                                        <option value="Non-Vegetarian" style={{color: '#000', background: '#fff'}}>Non-Vegetarian</option>
                                                        <option value="Vegan" style={{color: '#000', background: '#fff'}}>Vegan</option>
                                                    </select>
                                                </div>
                                                {t.specialRequirements?.medicalConditionSupport && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <textarea
                                                            placeholder="Medical condition details or assistance required"
                                                            value={t.specialRequirements.medicalConditionDetails || ''}
                                                            onChange={e => updateTravelerRequirement(idx, 'medicalConditionDetails', e.target.value)}
                                                            style={{ width: '100%', minHeight: '70px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', fontSize: '13px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>Estimated Travelers</div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>{formData.numberOfPeople} traveler{formData.numberOfPeople === 1 ? '' : 's'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>Traveler Type</div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>{getTravelerType(travelers)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>Adults / Children / Infants</div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>{travelerCounts.Adult || 0} / {travelerCounts.Child || 0} / {travelerCounts.Infant || 0}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>Estimated Package Cost</div>
                                        <div style={{ color: 'var(--accent)', fontWeight: '700' }}>₹{((bookingForm.destination.price || 5000) * totalMultipliers).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                            </div>

                            {getPersonalizedRecommendations(getTravelerType(travelers)).length > 0 && (
                                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.2)', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Smart Traveler Guidance</div>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {getPersonalizedRecommendations(getTravelerType(travelers)).map((item, idx) => (
                                            <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                                <strong style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>{item.title}</strong>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detected profile badge */}
                            <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-main)', marginBottom: '15px', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                                💡 <strong>Traveler Profile:</strong> {getTravelerType(travelers)} &bull; <strong>Price Multiplier:</strong> {totalMultipliers}x
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-accent" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }}>Submit Booking</button>
                                <button type="button" className="btn btn-danger" onClick={() => setBookingForm(null)} style={{ flex: 1, padding: '12px', fontWeight: 'bold' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                {dynamicChips.map((chip, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(chip)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '15px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        {chip}
                    </button>
                ))}
            </div>
            <div className="chat-input" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {micError && (
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#fca5a5',
                        fontSize: '13px'
                    }}>
                        {micError}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {selectedImage && (
                        <div style={{ position: 'relative', width: 'fit-content' }}>
                            <img src={selectedImage} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }} />
                            <button
                                onClick={() => { setSelectedImage(null); setImageMimeType(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <EmergencyButton onClick={() => setShowEmergencyModal(true)} />
                        <EmergencyModal
                            visible={showEmergencyModal}
                            onClose={() => setShowEmergencyModal(false)}
                            onSubmit={(query) => {
                                setShowEmergencyModal(false);
                                if (navigator && navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition((pos) => callEmergency(query, { lat: pos.coords.latitude, lng: pos.coords.longitude }), () => callEmergency(query));
                                } else {
                                    callEmergency(query);
                                }
                            }}
                        />

                        <button
                            type="button"
                            className="btn mic-btn"
                            onClick={toggleListening}
                            style={{
                                flexShrink: 0,
                                background: (isListening || isMicStarting) ? '#ef4444' : 'rgba(0, 85, 255, 0.12)',
                                color: (isListening || isMicStarting) ? '#fff' : 'var(--accent)',
                                border: `2px solid ${(isListening || isMicStarting) ? '#ef4444' : 'rgba(255,255,255,0.35)'}`,
                                boxShadow: (isListening || isMicStarting)
                                    ? '0 0 20px rgba(239, 68, 68, 0.45)'
                                    : '0 0 15px rgba(0, 85, 255, 0.25)',
                                animation: isListening ? 'mic-pulse 1.5s infinite' : 'none',
                                opacity: isMicStarting ? 0.85 : 1
                            }}
                            title={isListening ? 'Tap to stop and send' : isMicStarting ? 'Starting microphone...' : 'Tap to speak'}
                        >
                            {isMicStarting ? (
                                <span className="mic-loading-spinner" aria-hidden="true" />
                            ) : isListening ? (
                                <MicOff size={20} />
                            ) : (
                                <Mic size={20} />
                            )}
                        </button>

                        <input
                            type="text"
                            placeholder={
                                isMicStarting
                                    ? 'Starting microphone...'
                                    : isListening
                                        ? 'Listening... tap mic again when done'
                                        : 'Ask me something...'
                            }
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (!isListening) {
                                    voiceTranscriptRef.current = e.target.value;
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            style={{ flex: 1 }}
                        />

                        <input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />
                        <button title="Upload Image" className="btn" onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <ImageIcon size={20} />
                        </button>

                        <button title="Send feedback" className="btn" onClick={() => setShowFeedbackModal(true)} style={{ marginRight: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            ⭐
                        </button>
                        <FeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} afterSubmit={(r) => { /* no-op or show toast */ }} />

                        <button id="chat-send-btn" className="btn" onClick={handleSend}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
            </>
            )}
            {expandedHotel && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '800px', maxHeight: '90vh',
                        overflowY: 'auto', padding: '30px', position: 'relative',
                        background: 'rgba(15, 23, 42, 0.97)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}>
                        <button className="btn btn-danger" 
                            style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}
                            onClick={() => setExpandedHotel(null)}>
                            ✕ Close
                        </button>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-main)' }}>🏨 {expandedHotel}</h2>
                            <p style={{ margin: '5px 0 0 0', color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>Guest Reviews & Quality Ratings</p>
                        </div>
                        
                        <ReviewsSection 
                            entityId={expandedHotel} 
                            entityType="hotel" 
                        />
                    </div>
                </div>
            )}
            
            {showCommunityModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', maxHeight: '90vh',
                        overflowY: 'auto', padding: '30px', position: 'relative',
                        background: 'rgba(15, 23, 42, 0.97)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}>
                        <button className="btn btn-danger" 
                            style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}
                            onClick={() => setShowCommunityModal(false)}>
                            ✕
                        </button>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-main)' }}>🌍 Submit a Hidden Gem</h2>
                            <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Help the community discover amazing new places.</p>
                        </div>
                        
                        <form onSubmit={submitCommunityPlace} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)' }}>Place Name</label>
                                <input type="text" required value={communityFormData.placeName} onChange={e => setCommunityFormData({...communityFormData, placeName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)' }}>Location / City</label>
                                <input type="text" required value={communityFormData.location} onChange={e => setCommunityFormData({...communityFormData, location: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)' }}>Category</label>
                                <select value={communityFormData.category} onChange={e => setCommunityFormData({...communityFormData, category: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'white' }}>
                                    <option value="hidden-gem">Hidden Gem</option>
                                    <option value="scenic">Scenic Spot</option>
                                    <option value="local-food">Local Food</option>
                                    <option value="cultural">Cultural</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)' }}>Description & Experience</label>
                                <textarea required rows="4" value={communityFormData.description} onChange={e => setCommunityFormData({...communityFormData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'white', resize: 'vertical' }}></textarea>
                            </div>
                            <button type="submit" className="btn btn-accent" style={{ padding: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                                Submit for Review
                            </button>
                        </form>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
};

export default Chatbot;
