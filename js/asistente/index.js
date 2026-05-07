// ============================================
// INDEX - Punto de entrada del asistente
// ============================================

import { cargarConocimiento } from './datos.js';
import { toggleAsistente, procesarPregunta } from './core.js';

// Inicializar asistente
export async function initAsistente() {
    await cargarConocimiento();
    
    const btnPC = document.getElementById('asistente-btn');
    if (btnPC) btnPC.onclick = toggleAsistente;
    
    const btnHeader = document.getElementById('aiBtn');
    if (btnHeader) btnHeader.onclick = toggleAsistente;
    
    const closeBtn = document.getElementById('asistente-close');
    if (closeBtn) closeBtn.onclick = toggleAsistente;
    
    const sendBtn = document.getElementById('asistente-send');
    if (sendBtn) sendBtn.onclick = procesarPregunta;
    
    const input = document.getElementById('asistente-input');
    if (input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter') procesarPregunta();
        };
    }
    
    const overlay = document.getElementById('asistente-overlay');
    if (overlay) overlay.onclick = toggleAsistente;
}

// Exportar para uso global (window)
window.initAsistente = initAsistente;
window.toggleAsistente = toggleAsistente;