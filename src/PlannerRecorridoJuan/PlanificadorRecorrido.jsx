import React, { useEffect, useRef } from 'react';
import planificadorHtmlRaw from './Nuevo/planificador migusto.html?raw';
import { supabase } from '../supabase';

// Inyectar ocultamiento visual de scrollbars permitiendo desplazamiento activo
const cleanHtmlContent = planificadorHtmlRaw
  .replace('irA("planificacion");', 'irA("mapa");')
  .replace(
    '</head>',
    `<style>
      html, body {
        overflow-y: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    </style></head>`
  );

export default function PlanificadorRecorrido() {
  const iframeRef = useRef(null);

  const pushGpsToIframeWindow = (list) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.liveGpsData = list;
        if (typeof iframeRef.current.contentWindow.renderMapa === 'function') {
          iframeRef.current.contentWindow.renderMapa();
        }
      } catch (e) {
        console.error('Error pushing GPS to iframe window:', e);
      }
    }
  };

  const syncGps = async () => {
    let list = [];
    try {
      const store = JSON.parse(localStorage.getItem('migusto_gps_live_v1') || '{}');
      list = Object.values(store);
    } catch(e){}

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros')
          .select('datos')
          .eq('tipo', 'gps_live');

        if (!error && data && data.length > 0) {
          const supaList = data.map(r => r.datos).filter(Boolean);
          supaList.forEach(item => {
            if (item && item.patente) {
              const idx = list.findIndex(l => l.patente === item.patente);
              if (idx !== -1) list[idx] = item; else list.push(item);
            }
          });
        }
      } catch(e){}
    }

    if (list.length > 0) {
      pushGpsToIframeWindow(list);
    }
  };

  useEffect(() => {
    syncGps();

    let channel = null;
    if (supabase) {
      channel = supabase
        .channel('gps_live_realtime_planner_v8')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: 'tipo=eq.gps_live' }, () => {
          syncGps();
        })
        .subscribe();
    }

    const interval = setInterval(syncGps, 1000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)', minHeight: '850px', border: 'none', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        srcDoc={cleanHtmlContent}
        onLoad={() => { syncGps(); setTimeout(syncGps, 400); setTimeout(syncGps, 1200); }}
        title="Planificador Recorrido Mi Gusto"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
          background: '#0d0f11',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      />
    </div>
  );
}
