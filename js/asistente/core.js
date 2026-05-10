// ============================================
// CORE - Funciones principales del chat
// ============================================

import { getConocimientoData } from './datos.js';
import { buscarRespuesta } from './respuestas.js';

let conocimientoData = getConocimientoData();
let mensajeBienvenida = null;

// ============================================
// CARGAR BIENVENIDA DESDE FAQS.TXT
// ============================================
async function cargarBienvenida() {
    try {
        const response = await fetch('datos/faqs.txt');
        const texto = await response.text();
        const lineas = texto.split('\n');
        // La primera línea no vacía que NO empiece con ¿ es la bienvenida
        for (const linea of lineas) {
            const lineaTrim = linea.trim();
            if (lineaTrim !== '' && !lineaTrim.startsWith('¿')) {
                mensajeBienvenida = "👋 " + lineaTrim;
                break;
            }
        }
        // Si no se encontró, usar mensaje por defecto
        if (!mensajeBienvenida) {
            mensajeBienvenida = "👋 ¡Hola! Soy tu asistente de ESTUDIO SIMO. ¿En qué puedo ayudarte?";
        }
    } catch (error) {
        console.error('Error cargando bienvenida:', error);
        mensajeBienvenida = "👋 ¡Hola! Soy tu asistente de ESTUDIO SIMO. ¿En qué puedo ayudarte?";
    }
}

// Llamar a la función para cargar la bienvenida
cargarBienvenida();

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
export async function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    const pregunta = input.value.trim();
    if (!pregunta) return;
    
    agregarMensaje(pregunta, true);
    input.value = '';
    
    const respuesta = await buscarRespuesta(pregunta);
    setTimeout(() => {
        agregarMensaje(respuesta, false);
    }, 300);
}

// Mostrar/ocultar botones Subir según el estado del chat
function toggleBotonSubir(chatAbierto) {
    const btnSubirBiblio = document.getElementById('btn-subir-biblioteca');
    const btnSubirLey = document.getElementById('btn-subir-ley');
    
    if (chatAbierto) {
        // Ocultar ambos
        if (btnSubirBiblio) btnSubirBiblio.style.display = 'none';
        if (btnSubirLey) btnSubirLey.style.display = 'none';
    } else {
        // Mostrar solo si el scroll lo permite
        if (btnSubirBiblio) {
            btnSubirBiblio.style.display = window.scrollY > 300 ? 'block' : 'none';
        }
        if (btnSubirLey) {
            btnSubirLey.style.display = window.scrollY > 300 ? 'block' : 'none';
        }
    }
}

// Abrir/Cerrar chat con animación
export function toggleAsistente() {
    const modal = document.getElementById('asistente-modal');
    const overlay = document.getElementById('asistente-overlay');
    
    if (modal.classList.contains('visible')) {
        // Cerrar
        modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
        setTimeout(() => {
            if (!modal.classList.contains('visible')) {
                modal.style.visibility = 'hidden';
                if (overlay) overlay.style.visibility = 'hidden';
                toggleBotonSubir(false);
            }
        }, 300);
    } else {
        // Abrir
        modal.style.visibility = 'visible';
        if (overlay) overlay.style.visibility = 'visible';
        toggleBotonSubir(true);
        setTimeout(() => {
            modal.classList.add('visible');
            if (overlay) overlay.classList.add('visible');
        }, 10);
        
        // ========================================
        // MENSAJE DE BIENVENIDA (solo si el chat está vacío)
        // ========================================
        const body = document.getElementById('asistente-body');
        if (body && body.children.length === 0 && mensajeBienvenida) {
            agregarMensaje(mensajeBienvenida, false);
        }
    }
}