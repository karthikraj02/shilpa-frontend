import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TripCard = ({ trip, onOpen }) => {
  const totalSpent = (trip.expenses || []).reduce((s,e)=>s+(e.amount||0),0);
  return (
    <div style={{ display:'flex', gap:12, padding:16, borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
      <div style={{ flex:'0 0 80px', textAlign:'center' }}>
        <div style={{ fontSize:30 }}>📍</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text-main)' }}>{trip.destination || 'Unknown Destination'}</div>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>{trip.bookingProvider || 'External' } • {trip.travelDate ? new Date(trip.travelDate).toLocaleDateString() : 'Date not set'}</div>
        <div style={{ marginTop:8, display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Status: <strong style={{ color:'var(--text-main)', marginLeft:6 }}>{trip.status}</strong></div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Planned: ₹{trip.budgetPlanned||0}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Spent: ₹{totalSpent}</div>
        </div>
      </div>
      <div>
        <button className="btn" onClick={()=>onOpen(trip)} style={{ padding:'8px 12px' }}>Open</button>
      </div>
    </div>
  );
};

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const username = localStorage.getItem('username') || 'guest';

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/trips/user/${username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setTrips(res.data || []);
    } catch (err) {
      console.error('Load trips', err);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div style={{ padding:20 }}>
      <h2 style={{ color:'var(--text-main)' }}>My Trips</h2>
      <div style={{ display:'grid', gap:12, marginTop:12 }}>
        {loading ? <div style={{ color:'var(--text-muted)' }}>Loading...</div> : trips.length===0 ? <div style={{ color:'var(--text-muted)' }}>No trips yet. Import a booking after completing an external booking.</div> : trips.map(t=> <TripCard trip={t} key={t._id} onOpen={(trip)=>setSelected(trip)} />)}
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:12000 }}>
          <div onClick={()=>setSelected(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} />
          <div style={{ width:'min(900px,96%)', borderRadius:12, padding:20, background:'rgba(10,12,20,0.9)', border:'1px solid rgba(37,99,235,0.08)', color:'#e6eef8' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0 }}>{selected.destination}</h3>
                <div style={{ color:'var(--text-muted)' }}>{selected.bookingProvider} • {selected.bookingId}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:20 }}>✖</button>
            </div>
            <div style={{ marginTop:12 }}>
              <h4 style={{ color:'var(--text-main)' }}>Transport</h4>
              <pre style={{ background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8 }}>{JSON.stringify(selected.transportDetails||{}, null, 2)}</pre>

              <h4 style={{ color:'var(--text-main)', marginTop:12 }}>Hotel</h4>
              <pre style={{ background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8 }}>{JSON.stringify(selected.hotelDetails||{}, null, 2)}</pre>

              <h4 style={{ color:'var(--text-main)', marginTop:12 }}>Expenses</h4>
              <div style={{ display:'grid', gap:8 }}>
                {(selected.expenses||[]).map((e,i)=> (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:8, borderRadius:8, background:'rgba(255,255,255,0.02)' }}>
                    <div><strong>{e.type}</strong><div style={{ fontSize:12, color:'var(--text-muted)' }}>{e.note}</div></div>
                    <div>₹{e.amount}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <button className="btn" onClick={async ()=>{ try { await axios.post('/api/trips/import', { bookingProvider: 'Manual', bookingId: 'manual', destination:selected.destination }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); alert('Created quick trip'); load(); } catch(e){console.error(e);} }}>Quick Duplicate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTrips;
