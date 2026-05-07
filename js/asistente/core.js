// ============================================
// CORE - Funciones principales del chat
// ============================================

import { getConocimientoData } from './datos.js';
import { buscarRespuesta } from './respuestas.js';

let conocimientoData = getConocimientoData();

// Agregar mensaje al chat
export function agregarMensaje(texto, esUsuario) {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    const div = document.createElement('div');
    div.className = `mensaje mensaje-${esUsuario ? 'usuario' : 'bot'}`;
    div.textContent = texto;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// Procesar pregunta del usuario
export function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    const pregunta = input.value.trim();
    if (!pregunta) return;
    
    agregarMensaje(pregunta, true);
    input.value = '';
    
    const respuesta = buscarRespuesta(pregunta);
    setTimeout(() => {
        agregarMensaje(respuesta, false);
    }, 300);
}

// Abrir/Cerrar chat
export function toggleAsistente() {
    const modal = document.getElementById('asistente-modal');
    const overlay = document.getElementById('asistente-overlay');
    const conocimientoData = getConocimientoData();
    
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';
        if (conocimientoData && conocimientoData.bienvenida) {
            const body = document.getElementById('asistente-body');
            if (body && body.children.length === 0) {
                agregarMensaje(conocimientoData.bienvenida, false);
            }
        }
    }
}