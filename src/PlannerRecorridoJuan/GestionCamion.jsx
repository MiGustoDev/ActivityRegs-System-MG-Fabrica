import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Truck, Calendar, User, Gauge, Fuel, AlertTriangle, 
  CheckSquare, FileSpreadsheet, Plus, Trash2, Save, CheckCircle, 
  ChevronRight, Filter, Download
} from 'lucide-react';

const CAMIONES_DEFAULT = [
  { id: 'cam1', patente: 'AF 123 MG', modelo: 'Mercedes-Benz Accelo 815' },
  { id: 'cam2', patente: 'AE 456 MG', modelo: 'Iveco Daily 70C17' },
  { id: 'cam3', patente: 'AD 789 MG', modelo: 'Ford Cargo 915' },
  { id: 'cam4', patente: 'AG 321 MG', modelo: 'Mercedes-Benz Atego 1419' }
];

export default function GestionCamion() {
  const [activeTab, setActiveTab] = useState('bitacora'); // 'bitacora', 'historial', 'rendimiento', 'config'
  const [bitacoras, setBitacoras] = useState([]);
  const [camiones, setCamiones] = useState(CAMIONES_DEFAULT);
  const [toastMsg, setToastMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    patente: CAMIONES_DEFAULT[0].patente,
    chofer: '',
    kmInicial: '',
    kmFinal: '',
    litrosCargados: '',
    costoCombustible: '',
    estacionServicio: '',
    checkAceite: true,
    checkAgua: true,
    checkNeumaticos: true,
    checkLuces: true,
    checkLimpieza: true,
    checkDocumentacion: true,
    tieneFalla: false,
    fallaUrgencia: 'baja',
    fallaDescripcion: '',
    gastosDescripcion: '',
    gastosMonto: ''
  });

  // Filter state for Historial
  const [filtroPatente, setFiltroPatente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  useEffect(() => {
    try {
      const savedBitacoras = localStorage.getItem('migusto_bitacoras_v1');
      if (savedBitacoras) setBitacoras(JSON.parse(savedBitacoras));

      const savedCamiones = localStorage.getItem('migusto_camiones_v1');
      if (savedCamiones) setCamiones(JSON.parse(savedCamiones));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveBitacora = (e) => {
    e.preventDefault();
    if (!formData.chofer) {
      showToast('⚠️ Por favor ingrese el nombre del chofer.');
      return;
    }

    const kmIni = Number(formData.kmInicial) || 0;
    const kmFin = Number(formData.kmFinal) || 0;
    const kmRecorridos = kmFin > kmIni ? kmFin - kmIni : 0;
    const litros = Number(formData.litrosCargados) || 0;
    const costo = Number(formData.costoCombustible) || 0;
    const rendimiento = (litros > 0 && kmRecorridos > 0) ? (kmRecorridos / litros).toFixed(2) : 'N/A';

    const newEntry = {
      id: Date.now().toString(),
      ...formData,
      kmRecorridos,
      rendimiento,
      timestamp: new Date().toISOString()
    };

    const updated = [newEntry, ...bitacoras];
    setBitacoras(updated);
    localStorage.setItem('migusto_bitacoras_v1', JSON.stringify(updated));

    showToast('✅ Bitácora registrada correctamente.');
    
    // Reset Form
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      patente: camiones[0]?.patente || '',
      chofer: '',
      kmInicial: '',
      kmFinal: '',
      litrosCargados: '',
      costoCombustible: '',
      estacionServicio: '',
      checkAceite: true,
      checkAgua: true,
      checkNeumaticos: true,
      checkLuces: true,
      checkLimpieza: true,
      checkDocumentacion: true,
      tieneFalla: false,
      fallaUrgencia: 'baja',
      fallaDescripcion: '',
      gastosDescripcion: '',
      gastosMonto: ''
    });
  };

  const handleDeleteBitacora = (id) => {
    const updated = bitacoras.filter(b => b.id !== id);
    setBitacoras(updated);
    localStorage.setItem('migusto_bitacoras_v1', JSON.stringify(updated));
    showToast('Registro eliminado');
  };

  const exportExcelRendimiento = () => {
    if (bitacoras.length === 0) {
      showToast('⚠️ No hay registros para exportar');
      return;
    }

    const dataRows = bitacoras.map(b => ({
      'Fecha': b.fecha,
      'Patente': b.patente,
      'Chofer': b.chofer,
      'Km Inicial': b.kmInicial,
      'Km Final': b.kmFinal,
      'Km Recorridos': b.kmRecorridos,
      'Litros Cargados': b.litrosCargados || 0,
      'Costo Combustible ($)': b.costoCombustible || 0,
      'Rendimiento (km/L)': b.rendimiento,
      'Tiene Falla': b.tieneFalla ? 'SÍ' : 'NO',
      'Detalle Falla': b.fallaDescripcion || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rendimiento Camiones');
    XLSX.writeFile(workbook, `Rendimiento_Camiones_MiGusto_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('📊 Reporte Excel generado');
  };

  const bitacorasFiltradas = bitacoras.filter(b => {
    if (filtroPatente && b.patente !== filtroPatente) return false;
    if (filtroFecha && b.fecha !== filtroFecha) return false;
    return true;
  });

  return (
    <div style={{ background: '#0a0a0a', color: '#f2f2f2', padding: '16px', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      
      {toastMsg && (
        <div style={{ background: '#22c55e', color: '#06210f', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div style={{ background: '#151515', padding: '16px 20px', borderRadius: '14px', border: '1px solid #272727', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e', fontWeight: 700 }}>Móvil & Bitácora</span>
          <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#f2f2f2' }}>
            Gestión de Camiones — Bitácora Digital
          </h2>
        </div>

        <button onClick={exportExcelRendimiento} style={{ background: '#22c55e', color: '#06210f', border: 'none', padding: '9px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FileSpreadsheet size={16} /> Exportar Excel
        </button>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'bitacora', label: '📝 Nueva Bitácora' },
          { id: 'historial', label: `📜 Historial (${bitacoras.length})` },
          { id: 'rendimiento', label: '📈 Rendimiento & Reportes' },
          { id: 'config', label: '⚙️ Camiones' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? '#22c55e' : '#151515',
              color: activeTab === t.id ? '#06210f' : '#9a9a9a',
              border: activeTab === t.id ? '1px solid #22c55e' : '1px solid #272727',
              padding: '8px 16px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: NUEVA BITÁCORA */}
      {activeTab === 'bitacora' && (
        <form onSubmit={handleSaveBitacora} style={{ background: '#151515', borderRadius: '14px', padding: '20px', border: '1px solid #272727', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#22c55e', borderBottom: '1px solid #272727', paddingBottom: '10px' }}>
            Registro de Salida / Registro Diario
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Fecha</label>
              <input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Camión / Patente</label>
              <select value={formData.patente} onChange={e => setFormData({ ...formData, patente: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                {camiones.map(c => (
                  <option key={c.id} value={c.patente}>{c.patente} ({c.modelo})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Nombre Chofer</label>
            <input type="text" placeholder="Nombre completo del chofer..." value={formData.chofer} onChange={e => setFormData({ ...formData, chofer: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Km Inicial</label>
              <input type="number" placeholder="Ej: 125000" value={formData.kmInicial} onChange={e => setFormData({ ...formData, kmInicial: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Km Final</label>
              <input type="number" placeholder="Ej: 125180" value={formData.kmFinal} onChange={e => setFormData({ ...formData, kmFinal: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} />
            </div>
          </div>

          <h4 style={{ fontSize: '13px', color: '#38bdf8', margin: '16px 0 10px' }}>⛽ Carga de Combustible (opcional)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Litros Cargados</label>
              <input type="number" placeholder="Ej: 45" value={formData.litrosCargados} onChange={e => setFormData({ ...formData, litrosCargados: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', marginBottom: '6px' }}>Costo Total ($)</label>
              <input type="number" placeholder="Ej: 52000" value={formData.costoCombustible} onChange={e => setFormData({ ...formData, costoCombustible: e.target.value })} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '10px', borderRadius: '6px', fontSize: '13px' }} />
            </div>
          </div>

          <h4 style={{ fontSize: '13px', color: '#a78bfa', margin: '16px 0 10px' }}>🛠️ Inspección Vehicular (Checklist)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'checkAceite', label: 'Aceite / Aceite Motor OK' },
              { key: 'checkAgua', label: 'Agua / Refrigerante OK' },
              { key: 'checkNeumaticos', label: 'Presión Neumáticos OK' },
              { key: 'checkLuces', label: 'Luces & Giros OK' },
              { key: 'checkLimpieza', label: 'Limpieza Interior OK' },
              { key: 'checkDocumentacion', label: 'Documentación OK' }
            ].map(chk => (
              <label key={chk.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f2f2f2', cursor: 'pointer', background: '#0a0a0a', padding: '8px 10px', borderRadius: '6px', border: '1px solid #272727' }}>
                <input
                  type="checkbox"
                  checked={formData[chk.key]}
                  onChange={e => setFormData({ ...formData, [chk.key]: e.target.checked })}
                  style={{ accentColor: '#22c55e' }}
                />
                <span>{chk.label}</span>
              </label>
            ))}
          </div>

          <button type="submit" style={{ width: '100%', background: '#22c55e', color: '#06210f', border: 'none', padding: '12px', borderRadius: '99px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            💾 Guardar Bitácora
          </button>
        </form>
      )}

      {/* TAB 2: HISTORIAL */}
      {activeTab === 'historial' && (
        <div style={{ background: '#151515', borderRadius: '14px', padding: '20px', border: '1px solid #272727' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <select value={filtroPatente} onChange={e => setFiltroPatente(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
              <option value="">Todas las patentes</option>
              {camiones.map(c => <option key={c.id} value={c.patente}>{c.patente}</option>)}
            </select>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #272727', color: '#f2f2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }} />
          </div>

          {bitacorasFiltradas.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#5c5c5c', border: '1px dashed #272727', borderRadius: '8px' }}>
              No hay bitácoras registradas con los filtros seleccionados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bitacorasFiltradas.map(b => (
                <div key={b.id} style={{ background: '#0a0a0a', borderRadius: '10px', padding: '14px', border: '1px solid #272727', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#22c55e', fontSize: '14px' }}>{b.patente}</strong>
                      <span style={{ fontSize: '12px', color: '#9a9a9a' }}>• {b.fecha}</span>
                      <span style={{ fontSize: '12px', color: '#38bdf8' }}>• Chofer: {b.chofer}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#5c5c5c', marginTop: '4px' }}>
                      Km recorridos: <strong>{b.kmRecorridos} km</strong> | Combustible: <strong>{b.litrosCargados || 0} L</strong> (${b.costoCombustible || 0}) | Rendimiento: <strong>{b.rendimiento} km/L</strong>
                    </div>
                  </div>

                  <button onClick={() => handleDeleteBitacora(b.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RENDIMIENTO */}
      {activeTab === 'rendimiento' && (
        <div style={{ background: '#151515', borderRadius: '14px', padding: '20px', border: '1px solid #272727' }}>
          <h3 style={{ color: '#22c55e', marginTop: 0 }}>📈 Resumen de Rendimiento de Flota</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', margin: '16px 0' }}>
            <div style={{ background: '#0a0a0a', padding: '14px', borderRadius: '8px', border: '1px solid #272727', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#f2f2f2' }}>
                {bitacoras.reduce((s, b) => s + (b.kmRecorridos || 0), 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>Km Totales Recorridos</div>
            </div>

            <div style={{ background: '#0a0a0a', padding: '14px', borderRadius: '8px', border: '1px solid #272727', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>
                {bitacoras.reduce((s, b) => s + (Number(b.litrosCargados) || 0), 0)} L
              </div>
              <div style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>Litros Carga Total</div>
            </div>

            <div style={{ background: '#0a0a0a', padding: '14px', borderRadius: '8px', border: '1px solid #272727', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e' }}>
                ${bitacoras.reduce((s, b) => s + (Number(b.costoCombustible) || 0), 0).toLocaleString('es-AR')}
              </div>
              <div style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>Costo Combustible</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURACIÓN CAMIONES */}
      {activeTab === 'config' && (
        <div style={{ background: '#151515', borderRadius: '14px', padding: '20px', border: '1px solid #272727' }}>
          <h3 style={{ color: '#f2f2f2', marginTop: 0 }}>⚙️ Flota de Camiones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {camiones.map(c => (
              <div key={c.id} style={{ background: '#0a0a0a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #272727', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#22c55e', fontSize: '14px' }}>{c.patente}</strong>
                  <span style={{ fontSize: '12px', color: '#9a9a9a', marginLeft: '10px' }}>{c.modelo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
