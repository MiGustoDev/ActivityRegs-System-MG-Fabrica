import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, History, Save, ClipboardList, Clock, User, HardHat, ClipboardCheck, Settings } from 'lucide-react'

const SECTORS = [
  { id: 'calidad', label: 'Calidad', icon: ClipboardCheck },
  { id: 'produccion', label: 'Produccion', icon: HardHat },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings }
];



const initialFormState = {
  codigo: 'INF-D002',
  revision: '0',
  producto: '',
  fecha: new Date().toISOString().split('T')[0],
  tipoPrueba: '',
  categoria: '', // MP, SE, PT, ME
  justificacion: '',
  descripcionPrueba: '',
  resultados: '',
  decisionFinal: '', // Aprobado, Rechazado, Condicional
  observaciones: '',
  responsable: ''
}

const App = () => {
  const [activeSector, setActiveSector] = useState('calidad')
  const [activeSubTab, setActiveSubTab] = useState('form')
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('regsapp_records_multisector_v2');
    return saved ? JSON.parse(saved) : [];
  })

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.producto || !formData.fecha) return;

    const newRecord = {
      id: Date.now(),
      sectorId: activeSector,
      ...formData,
      createdAt: new Date().toLocaleString()
    };

    setRecords([newRecord, ...records]);
    setFormData(initialFormState);
    setActiveSubTab('history');
  }

  const filteredRecords = records.filter(r => r.sectorId === activeSector);

  const handleRevisionChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData({...formData, revision: value});
  }

  return (
    <>
      <div className="app-container">
        {/* Logo Section */}
        <div className="logo-container">
          <img src="/Logo Mi Gusto 2025.png" alt="Mi Gusto Logo" className="app-logo" />
        </div>

        {/* Header & Main Tabs (Sectors) */}
        <header className="header">
          <div className="title-group">
            <h1>Registros</h1>
            <p>Sistema de gestion y Registro de actividad en fabrica</p>
          </div>

          <nav className="nav-tabs">
            {SECTORS.map(sector => (
              <button 
                key={sector.id}
                className={`tab-btn ${activeSector === sector.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSector(sector.id);
                  setActiveSubTab('form'); // Reset to form when changing sector
                }}
              >
                <sector.icon size={18} />
                <span>{sector.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Sub-Navigation for Registro/Historial */}
        <div className="sub-header" style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', gap: '2rem' }}>
          <button 
            onClick={() => setActiveSubTab('form')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: activeSubTab === 'form' ? 'white' : '#525252',
              fontWeight: activeSubTab === 'form' ? '700' : '400',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            Informe de pruebas
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: activeSubTab === 'history' ? 'white' : '#525252',
              fontWeight: activeSubTab === 'history' ? '700' : '400',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            Ver Historial
          </button>
        </div>

        {/* Main Content Area */}
        <main className="content">
          <AnimatePresence mode="wait">
            {activeSubTab === 'form' ? (
              <motion.div
                key={`${activeSector}-form`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >


                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', color: '#525252', margin: 0 }}>
                    Informe de Pruebas: {SECTORS.find(s => s.id === activeSector).label}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="record-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Código Informe</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="INF-00..."
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Revisión</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="0"
                        value={formData.revision}
                        onChange={handleRevisionChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Producto</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Nombre del producto"
                        value={formData.producto}
                        onChange={(e) => setFormData({...formData, producto: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tipo de Prueba</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Ej: Cambio/Mejora de proceso"
                        value={formData.tipoPrueba}
                        onChange={(e) => setFormData({...formData, tipoPrueba: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Categoría</label>
                      <div className="checkbox-group">
                        {['MP', 'SE', 'PT', 'ME'].map(cat => (
                          <button
                            type="button"
                            key={cat}
                            className={`chip-btn ${formData.categoria === cat ? 'active' : ''}`}
                            onClick={() => setFormData({...formData, categoria: cat})}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="form-group">
                    <label>Justificación</label>
                    <textarea 
                      className="form-control"
                      placeholder="Motivo de la prueba..."
                      value={formData.justificacion}
                      onChange={(e) => setFormData({...formData, justificacion: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción de la prueba</label>
                    <textarea 
                      className="form-control"
                      placeholder="Procedimiento realizado..."
                      value={formData.descripcionPrueba}
                      onChange={(e) => setFormData({...formData, descripcionPrueba: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Resultados obtenidos</label>
                    <textarea 
                      className="form-control"
                      placeholder="Hallazgos y datos medidos..."
                      value={formData.resultados}
                      onChange={(e) => setFormData({...formData, resultados: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Decisión Final</label>
                    <div className="decision-group">
                      {['Aprobado', 'Rechazado', 'Condicional'].map(decision => (
                        <button
                          type="button"
                          key={decision}
                          className={`decision-btn ${formData.decisionFinal === decision ? 'active' : ''}`}
                          onClick={() => setFormData({...formData, decisionFinal: decision})}
                        >
                          {decision}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Observaciones Finales</label>
                    <textarea 
                      className="form-control"
                      placeholder="Notas adicionales..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Responsable/s</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Nombres de los responsables"
                      value={formData.responsable}
                      onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    />
                  </div>


                  <button type="submit" className="submit-btn highlight">
                    <Save size={18} />
                    <span>Guardar Informe</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeSector}-history`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase', color: '#525252' }}>
                  Historial: {SECTORS.find(s => s.id === activeSector).label}
                </h2>
                {filteredRecords.length > 0 ? (
                  <div className="history-list">
                    {filteredRecords.map(record => (
                      <motion.div key={record.id} className="history-item" layout>
                        <div className="item-info">
                          <h3>{record.producto}</h3>
                          <div className="item-meta">
                            <p><Clock size={12} /> {record.fecha}</p>
                            <p><User size={12} /> {record.responsable}</p>
                            <span className={`badge ${record.decisionFinal?.toLowerCase()}`}>
                              {record.decisionFinal}
                            </span>
                          </div>
                        </div>
                        <div className="item-icon">
                          <ClipboardList size={20} color="#525252" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ClipboardList size={48} />
                    <p>Sin informes en {SECTORS.find(s => s.id === activeSector).label}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer className="footer">
        <p>
          © Desarrollado por el <strong>Departamento de Sistemas</strong> de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>
    </>
  )
}




export default App
