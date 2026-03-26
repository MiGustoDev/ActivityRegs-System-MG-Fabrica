import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, History, Save, ClipboardList, Clock, User, HardHat, ClipboardCheck, Settings } from 'lucide-react'

const SECTORS = [
  { id: 'calidad', label: 'Calidad', icon: ClipboardCheck },
  { id: 'produccion', label: 'Produccion', icon: HardHat },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings }
];

const App = () => {
  const [activeSector, setActiveSector] = useState('calidad')
  const [activeSubTab, setActiveSubTab] = useState('form')
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('regsapp_records_multisector');
    return saved ? JSON.parse(saved) : [];
  })

  const [formData, setFormData] = useState({ name: '', lastName: '' })

  useEffect(() => {
    localStorage.setItem('regsapp_records_multisector', JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName) return;

    const newRecord = {
      id: Date.now(),
      sectorId: activeSector,
      ...formData,
      createdAt: new Date().toLocaleString()
    };

    setRecords([newRecord, ...records]);
    setFormData({ name: '', lastName: '' });
    setActiveSubTab('history');
  }

  const filteredRecords = records.filter(r => r.sectorId === activeSector);


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
            Nuevo Registro
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
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase', color: '#525252' }}>
                  Registro en Area: {SECTORS.find(s => s.id === activeSector).label}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input 
                      id="name"
                      type="text" 
                      className="form-input" 
                      placeholder="Nombre del operario"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Apellido</label>
                    <input 
                      id="lastName"
                      type="text" 
                      className="form-input" 
                      placeholder="Apellido del operario"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    <Save size={18} />
                    <span>Guardar</span>
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
                  Historial de: {SECTORS.find(s => s.id === activeSector).label}
                </h2>
                {filteredRecords.length > 0 ? (
                  <div className="history-list">
                    {filteredRecords.map(record => (
                      <motion.div key={record.id} className="history-item" layout>
                        <div className="item-info">
                          <h3>{record.name} {record.lastName}</h3>
                          <p>
                            <Clock size={12} />
                            {record.createdAt}
                          </p>
                        </div>
                        <div className="item-icon">
                          <User size={20} color="#525252" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ClipboardList size={48} />
                    <p>Sin registros en {SECTORS.find(s => s.id === activeSector).label}</p>
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
