import React, { useState, useEffect, useRef } from 'react';
import { Truck, Navigation, Play, Square, AlertCircle, CheckCircle, Shield, Wifi, BatteryCharging } from 'lucide-react';
import { supabase } from '../supabase';

const CAMIONES_LIST = [
  { patente: 'AF 123 MG', modelo: 'Mercedes-Benz Accelo 815' },
  { patente: 'AE 456 MG', modelo: 'Iveco Daily 70C17' },
  { patente: 'AD 789 MG', modelo: 'Ford Cargo 915' },
  { patente: 'AG 321 MG', modelo: 'Mercedes-Benz Atego 1419' }
];

export default function ModoChoferTracker() {
  const [patente, setPatente] = useState(CAMIONES_LIST[0].patente);
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Listo para iniciar recorrido');
  const [accuracy, setAccuracy] = useState(null);
  const [updatesCount, setUpdatesCount] = useState(0);

  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Request Screen Wake Lock to keep display active
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock Error:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatusMsg('❌ Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setStatusMsg('🛰️ Obteniendo señal de GPS...');
    requestWakeLock();

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: spd, accuracy: acc } = position.coords;
        
        const now = new Date();
        const time24h = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        
        const coordData = {
          lat: latitude,
          lng: longitude,
          speed: spd ? Math.round(spd * 3.6) : 0, // m/s to km/h
          accuracy: Math.round(acc),
          updatedAt: time24h,
          timestamp: Date.now()
        };

        setCurrentCoords(coordData);
        setSpeed(coordData.speed);
        setAccuracy(coordData.accuracy);
        setUpdatesCount(prev => prev + 1);
        setStatusMsg('🟢 Viaje en curso — transmitiendo posición en vivo');

        // Broadcast live position & trail via LocalStorage
        try {
          const liveStore = JSON.parse(localStorage.getItem('migusto_gps_live_v1') || '{}');
          const currentTrk = liveStore[patente] || {};
          const prevTrail = currentTrk.trail || [];
          const newTrail = [...prevTrail, [latitude, longitude]];

          liveStore[patente] = {
            patente,
            ...coordData,
            trail: newTrail
          };
          localStorage.setItem('migusto_gps_live_v1', JSON.stringify(liveStore));
          window.dispatchEvent(new Event('migusto_gps_update'));

          // Sincronizar en tiempo real con la nube Supabase para acceso remoto
          if (supabase) {
            supabase.from('gps_live').upsert({
              patente,
              lat: latitude,
              lng: longitude,
              speed: coordData.speed,
              accuracy: coordData.accuracy,
              trail: newTrail,
              updated_at: new Date().toISOString()
            }).then(({ error }) => {
              if (error) console.error('Error Supabase GPS Sync:', error);
            });
          }
        } catch (e) {
          console.error(e);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        setStatusMsg(`⚠️ Error de GPS: ${error.message}`);
      },
      options
    );

    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsTracking(false);
    setStatusMsg('⏹ Viaje cerrado');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, []);

  return (
    <div style={{ background: '#0a0a0a', color: '#f2f2f2', padding: '20px', borderRadius: '16px', border: '1px solid #272727', maxWidth: '500px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.12)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid #22c55e' }}>
          <Truck size={28} color="#22c55e" />
        </div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Modo Chofer — Control de Viaje</h2>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9a9a9a' }}>
          Iniciá tu viaje para transmitir tu ubicación y recorrido en vivo.
        </p>
      </div>

      {/* Select Truck */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '8px' }}>
          Seleccionar Camión / Patente
        </label>
        <select
          value={patente}
          onChange={e => setPatente(e.target.value)}
          disabled={isTracking}
          style={{ width: '100%', background: '#151515', border: '1px solid #272727', color: '#f2f2f2', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, outline: 'none' }}
        >
          {CAMIONES_LIST.map(c => (
            <option key={c.patente} value={c.patente}>{c.patente} — {c.modelo}</option>
          ))}
        </select>
      </div>

      {/* Status Bar */}
      <div style={{ background: isTracking ? 'rgba(34, 197, 94, 0.15)' : '#151515', border: isTracking ? '1px solid #22c55e' : '1px solid #272727', padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: isTracking ? '#22c55e' : '#9a9a9a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {isTracking && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }}></span>}
          <span>{statusMsg}</span>
        </div>

        {currentCoords && (
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#9a9a9a', textAlign: 'left', background: '#0a0a0a', padding: '10px', borderRadius: '6px' }}>
            <div>Lat: <strong style={{ color: '#f2f2f2' }}>{currentCoords.lat.toFixed(5)}</strong></div>
            <div>Lng: <strong style={{ color: '#f2f2f2' }}>{currentCoords.lng.toFixed(5)}</strong></div>
            <div>Velocidad: <strong style={{ color: '#38bdf8' }}>{speed} km/h</strong></div>
            <div>Última transmisión: <strong style={{ color: '#22c55e' }}>{currentCoords.updatedAt}</strong></div>
          </div>
        )}
      </div>

      {/* Main Action Controls */}
      {!isTracking ? (
        <button
          onClick={startTracking}
          style={{ width: '100%', background: '#22c55e', color: '#06210f', border: 'none', padding: '16px', borderRadius: '99px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)' }}
        >
          <Play size={20} fill="#06210f" /> Iniciar viaje
        </button>
      ) : (
        <button
          onClick={stopTracking}
          style={{ width: '100%', background: '#ef4444', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '99px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
        >
          <Square size={20} fill="#ffffff" /> Cerrar viaje
        </button>
      )}

      {/* Recommendation Box */}
      <div style={{ marginTop: '20px', background: '#151515', padding: '12px', borderRadius: '8px', border: '1px solid #272727', fontSize: '11px', color: '#5c5c5c', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <BatteryCharging size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Recomendación:</strong> Mantener el celular en el soporte del vehículo conectado al cargador de 12V. La app mantendrá la pantalla activa para asegurar la transmisión ininterrumpida.
        </span>
      </div>

    </div>
  );
}
