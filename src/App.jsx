import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, History, Save, ClipboardList, Clock, User } from 'lucide-react'

const App = () => {
  const [activeTab, setActiveTab] = useState('form')
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('regsapp_records');
    return saved ? JSON.parse(saved) : [];
  })

  // State for the form
  const [formData, setFormData] = useState({
    name: '',
    lastName: ''
  })

  // Persistence
  useEffect(() => {
    localStorage.setItem('regsapp_records', JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName) return;

    const newRecord = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toLocaleString()
    };

    setRecords([newRecord, ...records]);
    setFormData({ name: '', lastName: '' });
    setActiveTab('history');
  }

  return (
    <div className="app-container">
      {/* Logo Section */}
      <div className="logo-container">
        <img src="/Logo Mi Gusto 2025.png" alt="Mi Gusto Logo" className="app-logo" />
      </div>

      {/* Header & Tabs */}
      <header className="header">
        <div className="title-group">
          <h1>Registros</h1>
          <p>Sistema de gestion y Registro de actividad en fabrica</p>
        </div>

        <nav className="nav-tabs">

          <button 
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <PlusCircle size={18} />
            <span>Formulario</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Historial</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="content">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nombre</label>
                  <input 
                    id="name"
                    type="text" 
                    className="form-input" 
                    placeholder="Ingrese su nombre"
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
                    placeholder="Ingrese su apellido"
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
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {records.length > 0 ? (
                <div className="history-list">
                  {records.map(record => (
                    <motion.div 
                      key={record.id} 
                      className="history-item"
                      layout
                    >
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
                  <p>Aún no hay registros en el historial</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
