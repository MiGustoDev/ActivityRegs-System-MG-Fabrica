import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Chart, registerables } from 'chart.js';
import { 
  MapPin, Upload, Download, RefreshCw, Layers, Sliders, History, 
  CheckCircle, AlertCircle, FileSpreadsheet, Plus, Trash2, Edit2, 
  Truck, ArrowRight, Eye, ChevronDown, ChevronUp, Lock, Save, X
} from 'lucide-react';
import { supabase } from '../supabase';

Chart.register(...registerables);

const EMPANADA_PRODUCTS_DEFAULT = ["CP","BU","AC","BB","MPP","CC","CA","CS","PO","PC","JQ","VP","MT","QC","RJ","CH","V","JH","4Q","CZ","SGR"];

const RECORRIDOS_CONFIG_DEFAULT = [
  { id: 1, nombre: "CABA", capacidadCamion: 32, locales: ["Balvanera","V.Crespo","Paternal","Caballito","Floresta","Mataderos","Cañitas","Barr. Belgrano","Belgrano","Palermo N","P.Madero","Ituzaingo","Merlo","Moreno"] },
  { id: 2, nombre: "CAMPANA", capacidadCamion: 32, locales: ["Torcuato","Pacheco","Maschwitz","Escobar","Camp.","Pilar Centro","PilarPalmas","del Viso","Polvorines","JC.Paz","S.Miguel","Muñiz","B.Vista"] },
  { id: 3, nombre: "Z. NORTE", capacidadCamion: 32, locales: ["Hurl.","Florida","V.Lopez","V.Urquiza","Devoto","S.Martin","Ballester","V. Adelina","Munro","Martinez","S.Fernando","Tigre"] },
  { id: 4, nombre: "4TO CAMIÓN", capacidadCamion: 32, locales: [] }
];

const DIRECCIONES_COORDS_DEFAULT = {
  "Ballester":      { lat:-34.5480433, lng:-58.5525982, dir:"Ballester 4816, Villa Ballester" },
  "Balvanera":      { lat:-34.6034645, lng:-58.3926230, dir:"Av. Callao 474" },
  "Barr. Belgrano": { lat:-34.5549538, lng:-58.4545298, dir:"Av. Monroe 1801" },
  "Belgrano":       { lat:-34.5626971, lng:-58.4647899, dir:"Av. Dr. Ricardo Balbín 2395" },
  "B.Vista":        { lat:-34.5601527, lng:-58.6786566, dir:"Av. Senador Morón 903, Bella Vista" },
  "Caballito":      { lat:-34.6254160, lng:-58.4538909, dir:"Av. Rivadavia 6193" },
  "Camp.":          { lat:-34.1631153, lng:-58.9630887, dir:"Av. Mitre 974, Campana" },
  "Cañitas":        { lat:-34.5724611, lng:-58.4302837, dir:"Báez 227" },
  "del Viso":       { lat:-34.4382847, lng:-58.7904861, dir:"Colectora 12 de octubre 3252, Del Viso" },
  "Devoto":         { lat:-34.6074345, lng:-58.5147745, dir:"Av. Francisco Beiró 4523" },
  "Torcuato":       { lat:-34.4885316, lng:-58.6212612, dir:"Av. Marcelo T. de Alvear 2556, Don Torcuato" },
  "Escobar":        { lat:-34.3485288, lng:-58.7902416, dir:"Av. 25 de Mayo 501, Escobar" },
  "Floresta":       { lat:-34.6359747, lng:-58.4914886, dir:"Av. Rivadavia 9025" },
  "Florida":        { lat:-34.5265080, lng:-58.4888365, dir:"Av. San Martín 1904, Florida" },
  "Pacheco":        { lat:-34.4588909, lng:-58.6364698, dir:"Av. Constituyentes 167, Gral. Pacheco" },
  "Hurl.":          { lat:-34.5923149, lng:-58.6366429, dir:"Av. Vergara 4114, Hurlingham" },
  "Ituzaingo":      { lat:-34.6459840, lng:-58.6575150, dir:"Av. Santa Rosa 1164, Ituzaingó" },
  "JC.Paz":         { lat:-34.5237677, lng:-58.7551361, dir:"Av. Gaspar Campos 6420, José C. Paz" },
  "Polvorines":     { lat:-34.5044372, lng:-58.6873626, dir:"Av. Pdte. Juan D. Perón 2596, Los Polvorines" },
  "Martinez":       { lat:-34.4995702, lng:-58.5218861, dir:"Hipólito Yrigoyen 1834, Martínez" },
  "Maschwitz":      { lat:-34.3948760, lng:-58.7391943, dir:"Av. Villanueva 1782, Maschwitz" },
  "Mataderos":      { lat:-34.6558607, lng:-58.5073209, dir:"Av. Juan Bautista Alberdi 6450" },
  "Merlo":          { lat:-34.6744920, lng:-58.7207754, dir:"Av. Calle Real 223, Merlo" },
  "Moreno":         { lat:-34.6397815, lng:-58.7874110, dir:"Av. Del Libertador 899, Moreno" },
  "Muñiz":          { lat:-34.5516703, lng:-58.6993551, dir:"Av. León Gallardo 333, Muñiz" },
  "Munro":          { lat:-34.5271908, lng:-58.5183622, dir:"Av. Bartolomé Mitre 2510, Munro" },
  "Palermo N":      { lat:-34.5852693, lng:-58.4412129, dir:"Av. Cnel. Niceto Vega 5795, Palermo" },
  "Paternal":       { lat:-34.6083161, lng:-58.4644512, dir:"Av. Juan B. Justo 4551, Paternal" },
  "Pilar Centro":   { lat:-34.4591626, lng:-58.9122288, dir:"Lorenzo López 523, Pilar Centro" },
  "PilarPalmas":    { lat:-34.4498026, lng:-58.8707976, dir:"Av. Sgto. Cayetano Beliera 1334, Pilar" },
  "P.Madero":       { lat:-34.6113067, lng:-58.3636680, dir:"Pierina Dealessi 1176, Puerto Madero" },
  "S.Fernando":     { lat:-34.4470720, lng:-58.5470545, dir:"Av. Pdte. Perón 2240, San Fernando" },
  "S.Martin":       { lat:-34.5784825, lng:-58.5356118, dir:"Intendente Campos 1876, San Martín" },
  "S.Miguel":       { lat:-34.5384461, lng:-58.7096588, dir:"Serrano 1665, San Miguel" },
  "Tigre":          { lat:-34.4295683, lng:-58.5717550, dir:"Av. Cazón 699 esq. Marabotto, Tigre" },
  "V.Lopez":        { lat:-34.5253927, lng:-58.4722805, dir:"Av. Libertador 962, Vicente López" },
  "V. Adelina":     { lat:-34.5097873, lng:-58.5401801, dir:"Av. de Mayo 99, Villa Adelina" },
  "V.Crespo":       { lat:-34.5971937, lng:-58.4249742, dir:"Av. Córdoba 4102, Villa Crespo" },
  "V.Urquiza":      { lat:-34.5815848, lng:-58.4923432, dir:"Av. de los Constituyentes 4599, Villa Urquiza" },
};

const RECORRIDO_MAP_COLORS = { 1: "#3ecf8e", 2: "#4d94d6", 3: "#a78bfa", 4: "#e0a33a", 0: "#6b7681" };

export default function PlanificadorRecorrido() {
  const [activeTab, setActiveTab] = useState('mapa'); // 'mapa', 'planificador', 'historico', 'config'
  const [recorridos, setRecorridos] = useState([]);
  const [pedidoData, setPedidoData] = useState(null);
  const [selectedLocales, setSelectedLocales] = useState([]);
  const [config, setConfig] = useState({
    locales: [],
    productos: [],
    empanadaOrder: [...EMPANADA_PRODUCTS_DEFAULT]
  });
  const [direccionesCoords, setDireccionesCoords] = useState(DIRECCIONES_COORDS_DEFAULT);
  const [toastMsg, setToastMsg] = useState('');
  const [mapFilter, setMapFilter] = useState({ recorrido: '', vuelta: '', estado: '', text: '' });
  const [newLocDatalive, setNewLocDatalive] = useState('');
  const [newLocExcel, setNewLocExcel] = useState('');
  const [newLocRecorrido, setNewLocRecorrido] = useState('1');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('migusto_config_v1');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      } else {
        const initialLocales = [];
        RECORRIDOS_CONFIG_DEFAULT.forEach(r => {
          r.locales.forEach(l => {
            initialLocales.push({ datalive: l, excel: l, recorridoId: r.id });
          });
        });
        const initConfig = { locales: initialLocales, productos: [], empanadaOrder: EMPANADA_PRODUCTS_DEFAULT };
        setConfig(initConfig);
        localStorage.setItem('migusto_config_v1', JSON.stringify(initConfig));
      }

      const savedCoords = localStorage.getItem('migusto_direcciones_v1');
      if (savedCoords) {
        setDireccionesCoords(JSON.parse(savedCoords));
      }

      const savedRecs = localStorage.getItem('migusto_recorridos_v1');
      if (savedRecs) {
        setRecorridos(JSON.parse(savedRecs));
      } else {
        initDefaultRecorridos();
      }
    } catch (err) {
      console.error('Error initialization:', err);
    }
  }, []);

  const initDefaultRecorridos = () => {
    const locsByRec = {};
    RECORRIDOS_CONFIG_DEFAULT.forEach(r => { locsByRec[r.id] = [...r.locales]; });

    const newRecs = RECORRIDOS_CONFIG_DEFAULT.map(r => ({
      id: r.id,
      nombre: r.nombre,
      capacidadCamion: r.capacidadCamion,
      vueltas: [
        { id: `r${r.id}_v1`, nombre: 'Vuelta 1', locales: locsByRec[r.id] || [] },
        { id: `r${r.id}_v2`, nombre: 'Vuelta 2', locales: [] },
        { id: `r${r.id}_v3`, nombre: 'Vuelta 3', locales: [] }
      ]
    }));
    setRecorridos(newRecs);
    localStorage.setItem('migusto_recorridos_v1', JSON.stringify(newRecs));
  };

  const getBandejas = (datalive) => {
    if (!pedidoData) return null;
    let b = 0;
    if (pedidoData.empanadas && pedidoData.empanadas[datalive]) {
      b += Object.values(pedidoData.empanadas[datalive]).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }
    return b > 0 ? b : null;
  };

  const getCarrosLocal = (datalive) => {
    const bandejas = getBandejas(datalive);
    if (bandejas === null) return 0;
    return Math.round((bandejas / 18) * 10) / 10;
  };

  const getCarrosVuelta = (localesList) => {
    return localesList.reduce((sum, l) => sum + getCarrosLocal(l), 0);
  };

  const handleSelectLocal = (datalive, e) => {
    e.stopPropagation();
    setSelectedLocales(prev => 
      prev.includes(datalive) ? prev.filter(l => l !== datalive) : [...prev, datalive]
    );
  };

  const moveLocalesToVuelta = (targetRecId, targetVueltaIdx) => {
    if (selectedLocales.length === 0) return;
    
    setRecorridos(prevRecs => {
      const updated = prevRecs.map(rec => ({
        ...rec,
        vueltas: rec.vueltas.map(v => ({
          ...v,
          locales: v.locales.filter(l => !selectedLocales.includes(l))
        }))
      }));

      const targetRec = updated.find(r => r.id === targetRecId);
      if (targetRec && targetRec.vueltas[targetVueltaIdx]) {
        targetRec.vueltas[targetVueltaIdx].locales.push(...selectedLocales);
      }

      localStorage.setItem('migusto_recorridos_v1', JSON.stringify(updated));
      return updated;
    });

    showToast(`Movidos ${selectedLocales.length} locales a Vuelta ${targetVueltaIdx + 1}`);
    setSelectedLocales([]);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        const empanadasData = {};
        const mercaderiaData = {};

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (json.length < 2) return;

          const headers = json[0].map(h => String(h || '').trim());
          
          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length === 0) continue;

            const localName = String(row[0] || '').trim();
            if (!localName) continue;

            if (!empanadasData[localName]) empanadasData[localName] = {};

            headers.forEach((h, colIdx) => {
              if (colIdx === 0 || !h) return;
              const val = Number(row[colIdx]) || 0;
              if (val > 0) {
                empanadasData[localName][h] = (empanadasData[localName][h] || 0) + val;
              }
            });
          }
        });

        const newPedido = {
          filename: file.name,
          fecha: new Date().toLocaleDateString('es-AR'),
          empanadas: empanadasData,
          mercaderia: mercaderiaData
        };

        setPedidoData(newPedido);
        localStorage.setItem('migusto_pedido_v1', JSON.stringify(newPedido));
        showToast(`✅ Pedido cargado con éxito: ${file.name}`);
      } catch (err) {
        showToast('⚠️ Error al procesar el archivo Excel.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const [liveGpsData, setLiveGpsData] = useState({});
  const [showChoferTrail, setShowChoferTrail] = useState(true);

  useEffect(() => {
    const updateGps = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('migusto_gps_live_v1') || '{}');
        setLiveGpsData(stored);
      } catch (e) {}
    };
    updateGps();

    let channel = null;

    // Carga inicial y suscripción en tiempo real a la nube Supabase
    if (supabase) {
      supabase.from('gps_live').select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapData = {};
          data.forEach(item => {
            mapData[item.patente] = {
              patente: item.patente,
              lat: item.lat,
              lng: item.lng,
              speed: item.speed,
              accuracy: item.accuracy,
              trail: item.trail || [],
              updatedAt: new Date(item.updated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            };
          });
          setLiveGpsData(prev => ({ ...prev, ...mapData }));
        }
      });

      channel = supabase
        .channel('gps_live_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_live' }, (payload) => {
          const item = payload.new;
          if (item && item.patente) {
            const updatedTrk = {
              patente: item.patente,
              lat: item.lat,
              lng: item.lng,
              speed: item.speed,
              accuracy: item.accuracy,
              trail: item.trail || [],
              updatedAt: new Date(item.updated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            };
            setLiveGpsData(prev => ({
              ...prev,
              [item.patente]: updatedTrk
            }));
          }
        })
        .subscribe();
    }

    window.addEventListener('migusto_gps_update', updateGps);
    window.addEventListener('storage', updateGps);
    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('migusto_gps_update', updateGps);
      window.removeEventListener('storage', updateGps);
    };
  }, []);

  // Render Live GPS Truck Markers & Real-time Trails
  useEffect(() => {
    if (activeTab !== 'mapa') return;

    if (mapContainerRef.current) {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, { scrollWheelZoom: true }).setView([-34.58, -58.55], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const markers = [];
    config.locales.forEach(loc => {
      const coords = direccionesCoords[loc.datalive];
      if (!coords) return;

      if (mapFilter.recorrido && String(loc.recorridoId) !== mapFilter.recorrido) return;
      if (mapFilter.text && !loc.datalive.toLowerCase().includes(mapFilter.text.toLowerCase())) return;

      const recColor = RECORRIDO_MAP_COLORS[loc.recorridoId] || RECORRIDO_MAP_COLORS[0];

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:${recColor};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`<b>${loc.datalive}</b><br/>${coords.dir || ''}`);
      markers.push(marker);
    });

    // Render Live GPS Truck Markers & Route Trail
    const TRUCK_COLORS = {
      'AF 123 MG': '#22c55e',
      'AE 456 MG': '#38bdf8',
      'AD 789 MG': '#a78bfa',
      'AG 321 MG': '#fb923c'
    };

    Object.values(liveGpsData).forEach(trk => {
      if (!trk.lat || !trk.lng) return;
      if (mapFilter.camion && trk.patente !== mapFilter.camion) return;
      
      const trkColor = TRUCK_COLORS[trk.patente] || '#22c55e';

      const truckIcon = L.divIcon({
        className: 'custom-truck-pin',
        html: `<div style="background:${trkColor};color:#06210f;padding:4px 9px;border-radius:20px;font-weight:800;font-size:11px;border:2px solid white;box-shadow:0 0 14px ${trkColor};display:flex;align-items:center;gap:4px;">🚚 ${trk.patente}</div>`,
        iconSize: [110, 30],
        iconAnchor: [55, 15]
      });

      const truckMarker = L.marker([trk.lat, trk.lng], { icon: truckIcon }).addTo(map);
      truckMarker.bindPopup(`
        <div style="font-family:sans-serif;font-size:12px;">
          <strong style="color:${trkColor};">🚚 CAMIÓN EN VIVO (${trk.patente})</strong><br/>
          <strong>Velocidad:</strong> ${trk.speed || 0} km/h<br/>
          <small style="color:#666;">Última transmisión: ${trk.updatedAt || ''}</small>
        </div>
      `);
      markers.push(truckMarker);

      // Render Trail Line if enabled
      if (showChoferTrail && trk.trail && trk.trail.length > 1) {
        const polyline = L.polyline(trk.trail, {
          color: trkColor,
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6'
        }).addTo(map);
        markers.push(polyline);
      }
    });

    return () => {
      markers.forEach(m => {
        try { map.removeLayer(m); } catch (e) {}
      });
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, config, mapFilter, direccionesCoords, liveGpsData, showChoferTrail]);

  const handleAddLocalConfig = () => {
    if (!newLocDatalive) return;
    const newLoc = {
      datalive: newLocDatalive,
      excel: newLocExcel || newLocDatalive,
      recorridoId: Number(newLocRecorrido) || 1
    };
    const updated = { ...config, locales: [...config.locales, newLoc] };
    setConfig(updated);
    localStorage.setItem('migusto_config_v1', JSON.stringify(updated));
    setNewLocDatalive('');
    setNewLocExcel('');
    showToast('Local agregado a la configuración');
  };

  const handleDeleteLocalConfig = (datalive) => {
    const updated = { ...config, locales: config.locales.filter(l => l.datalive !== datalive) };
    setConfig(updated);
    localStorage.setItem('migusto_config_v1', JSON.stringify(updated));
    showToast('Local eliminado de la configuración');
  };

  return (
    <div style={{ background: '#0d0f11', color: '#e8ecef', padding: '16px', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      
      {toastMsg && (
        <div style={{ background: '#3ecf8e', color: '#06210f', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Toolbar */}
      <div style={{ background: '#14171a', padding: '16px 20px', borderRadius: '10px', border: '1px solid #242a30', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={22} /> Planificador de Recorrido Mi Gusto
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9aa4ad' }}>
            Organización logística de vueltas, ocupación de flota y ruteo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ background: '#3ecf8e', color: '#06210f', padding: '8px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} /> Cargar Pedido (Excel)
            <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => initDefaultRecorridos()} style={{ background: 'transparent', border: '1px solid #242a30', color: '#9aa4ad', padding: '8px 14px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Resetear Armado
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #242a30', paddingBottom: '8px' }}>
        {[
          { id: 'mapa', label: '🗺️ Mapa de Viajes en Vivo' },
          { id: 'planificador', label: '🚚 Armado de Recorridos' },
          { id: 'historico', label: '📊 Histórico' },
          { id: 'config', label: '⚙️ Configuración' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? '#1b1f23' : 'transparent',
              border: activeTab === t.id ? '1px solid #3ecf8e' : '1px solid transparent',
              color: activeTab === t.id ? '#3ecf8e' : '#9aa4ad',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PLANIFICADOR DE RECORRIDOS */}
      {activeTab === 'planificador' && (
        <div>
          {pedidoData && (
            <div style={{ background: '#1b1f23', padding: '10px 14px', borderRadius: '8px', border: '1px solid #242a30', marginBottom: '16px', fontSize: '12px', color: '#9aa4ad', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📄 Archivo cargado: <strong style={{ color: '#e8ecef' }}>{pedidoData.filename}</strong> ({pedidoData.fecha})</span>
              <span>Total sucursales en pedido: <strong style={{ color: '#3ecf8e' }}>{Object.keys(pedidoData.empanadas).length}</strong></span>
            </div>
          )}

          {selectedLocales.length > 0 && (
            <div style={{ background: 'rgba(77,148,214,0.15)', border: '1px solid #4d94d6', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4d94d6' }}>
                {selectedLocales.length} local(es) seleccionado(s)
              </span>
              <button onClick={() => setSelectedLocales([])} style={{ background: 'transparent', border: 'none', color: '#e5484d', cursor: 'pointer', fontSize: '12px' }}>
                Desmarcar todos
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {recorridos.map(rec => {
              const recColor = RECORRIDO_MAP_COLORS[rec.id] || RECORRIDO_MAP_COLORS[0];
              const totalCarrosRec = rec.vueltas.reduce((s, v) => s + getCarrosVuelta(v.locales), 0);

              return (
                <div key={rec.id} style={{ background: '#14171a', borderRadius: '10px', border: '1px solid #242a30', overflow: 'hidden' }}>
                  
                  <div style={{ padding: '12px 16px', background: '#1b1f23', borderBottom: '1px solid #242a30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: recColor }}></span>
                      <h3 style={{ margin: 0, fontSize: '15px', color: '#e8ecef', fontWeight: 700 }}>{rec.nombre}</h3>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9aa4ad', fontWeight: 600 }}>
                      Total: <strong style={{ color: recColor }}>{totalCarrosRec.toFixed(1)}</strong> carros
                    </span>
                  </div>

                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rec.vueltas.map((vuelta, vIdx) => {
                      const carrosVuelta = getCarrosVuelta(vuelta.locales);
                      const isOverCap = carrosVuelta > rec.capacidadCamion;

                      return (
                        <div 
                          key={vuelta.id || vIdx} 
                          onClick={() => selectedLocales.length > 0 && moveLocalesToVuelta(rec.id, vIdx)}
                          style={{
                            background: '#0d0f11',
                            borderRadius: '8px',
                            border: isOverCap ? '1px solid #e5484d' : '1px solid #22272c',
                            padding: '10px',
                            cursor: selectedLocales.length > 0 ? 'pointer' : 'default'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8ecef' }}>{vuelta.nombre}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isOverCap ? '#e5484d' : '#e0a33a' }}>
                              {carrosVuelta.toFixed(1)} / {rec.capacidadCamion} carros
                            </span>
                          </div>

                          <div style={{ height: '4px', background: '#242a30', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (carrosVuelta / rec.capacidadCamion) * 100)}%`, background: isOverCap ? '#e5484d' : recColor }}></div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '40px', alignContent: 'flex-start' }}>
                            {vuelta.locales.length === 0 ? (
                              <span style={{ fontSize: '11px', color: '#5f6b75', width: '100%', textAlign: 'center', paddingTop: '10px' }}>
                                Vuelta vacía
                              </span>
                            ) : (
                              vuelta.locales.map(locName => {
                                const isSel = selectedLocales.includes(locName);
                                const cCarros = getCarrosLocal(locName);

                                return (
                                  <div
                                    key={locName}
                                    onClick={(e) => handleSelectLocal(locName, e)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '99px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      background: isSel ? '#e5484d' : '#3ecf8e',
                                      color: isSel ? '#ffffff' : '#06210f',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      border: isSel ? '2px solid white' : 'none',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <span>{locName}</span>
                                    {cCarros > 0 && (
                                      <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '99px', padding: '0 5px', fontSize: '9.5px' }}>
                                        {cCarros.toFixed(1)}c
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MAPA INTERACTIVO */}
      {activeTab === 'mapa' && (
        <div style={{ background: '#14171a', borderRadius: '10px', padding: '16px', border: '1px solid #242a30' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <select
              value={mapFilter.recorrido}
              onChange={(e) => setMapFilter({ ...mapFilter, recorrido: e.target.value })}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="">Todos los recorridos</option>
              {RECORRIDOS_CONFIG_DEFAULT.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>

            <select
              value={mapFilter.camion || ''}
              onChange={(e) => setMapFilter({ ...mapFilter, camion: e.target.value })}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#22c55e', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
            >
              <option value="">🚚 Todos los camiones en vivo ({Object.keys(liveGpsData).length})</option>
              {Object.keys(liveGpsData).map(pat => (
                <option key={pat} value={pat}>Camión: {pat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="🔎 Buscar local..."
              value={mapFilter.text}
              onChange={(e) => setMapFilter({ ...mapFilter, text: e.target.value })}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', minWidth: '200px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#22c55e', fontWeight: 600, cursor: 'pointer', background: '#0d0f11', padding: '6px 12px', borderRadius: '6px', border: '1px solid #242a30' }}>
              <input
                type="checkbox"
                checked={showChoferTrail}
                onChange={e => setShowChoferTrail(e.target.checked)}
                style={{ accentColor: '#22c55e' }}
              />
              <span>📍 Mostrar trazo del recorrido real del chofer</span>
            </label>
          </div>

          <div ref={mapContainerRef} style={{ width: '100%', height: 'calc(100vh - 280px)', minHeight: '680px', borderRadius: '8px', overflow: 'hidden' }}></div>
        </div>
      )}

      {/* TAB 3: HISTÓRICO */}
      {activeTab === 'historico' && (
        <div style={{ background: '#14171a', borderRadius: '10px', padding: '20px', border: '1px solid #242a30' }}>
          <h3 style={{ color: '#a78bfa', marginTop: 0 }}>📊 Histórico Logístico y Métricas</h3>
          <p style={{ fontSize: '12px', color: '#9aa4ad' }}>
            Indicadores para planificar flota, demanda promedio de bandejas y tasa de ocupación de camiones.
          </p>
          <div style={{ padding: '24px', textAlign: 'center', color: '#5f6b75', border: '1px dashed #242a30', borderRadius: '8px', marginTop: '16px' }}>
            A medida que confirmes envíos diarios, aquí se acumulará el histórico de ocupación y promedios por sucursal.
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURACIÓN */}
      {activeTab === 'config' && (
        <div style={{ background: '#14171a', borderRadius: '10px', padding: '20px', border: '1px solid #242a30' }}>
          <h3 style={{ color: '#e8ecef', marginTop: 0 }}>⚙️ Configuración de Sucursales y Asignación</h3>
          
          <div style={{ background: '#0d0f11', padding: '14px', borderRadius: '8px', border: '1px solid #242a30', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nombre en Datalive"
              value={newLocDatalive}
              onChange={(e) => setNewLocDatalive(e.target.value)}
              style={{ background: '#1b1f23', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
            />
            <input
              type="text"
              placeholder="Nombre Excel"
              value={newLocExcel}
              onChange={(e) => setNewLocExcel(e.target.value)}
              style={{ background: '#1b1f23', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
            />
            <select
              value={newLocRecorrido}
              onChange={(e) => setNewLocRecorrido(e.target.value)}
              style={{ background: '#1b1f23', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
            >
              {RECORRIDOS_CONFIG_DEFAULT.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            <button
              onClick={handleAddLocalConfig}
              style={{ background: '#3ecf8e', color: '#06210f', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Agregar Local
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#1b1f23', borderBottom: '1px solid #242a30', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Local (Datalive)</th>
                  <th style={{ padding: '10px' }}>Nombre Excel</th>
                  <th style={{ padding: '10px' }}>Recorrido Asignado</th>
                  <th style={{ padding: '10px', width: '60px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {config.locales.map((loc, idx) => {
                  const rec = RECORRIDOS_CONFIG_DEFAULT.find(r => r.id === loc.recorridoId);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #22272c' }}>
                      <td style={{ padding: '10px', color: '#3ecf8e', fontWeight: 600 }}>{loc.datalive}</td>
                      <td style={{ padding: '10px' }}>{loc.excel}</td>
                      <td style={{ padding: '10px' }}>{rec ? rec.nombre : 'Sin asignar'}</td>
                      <td style={{ padding: '10px' }}>
                        <button
                          onClick={() => handleDeleteLocalConfig(loc.datalive)}
                          style={{ background: 'transparent', border: 'none', color: '#e5484d', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
