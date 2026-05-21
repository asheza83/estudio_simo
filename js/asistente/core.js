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
                let raw = "👋 " + lineaTrim;
                mensajeBienvenida = raw.replace(/\\n/g, '\n');
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

// ============================================
// ESTADO DE DESAMBIGUACIÓN (contexto entre turnos)
// ============================================
let estadoConfirmacion = {
    activo: false,
    preguntaOriginal: null,
    faqCandidata: null,
    respuestaCorrecta: null
};

// ============================================
// PROCESAR PREGUNTA (con desambiguación)
// ============================================
export async function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    const textoUsuario = input.value.trim();
    if (!textoUsuario) return;
    
    agregarMensaje(textoUsuario, true);
    input.value = '';
    
    // --------------------------------------------------
    // CASO 1: Estamos esperando confirmación (sí/no)
    // --------------------------------------------------
    if (estadoConfirmacion.activo) {
        const respuestaUsuario = textoUsuario.toLowerCase();
        if (respuestaUsuario === 'sí' || respuestaUsuario === 'si' || respuestaUsuario === 's') {
            // Usuario confirma → entregar la respuesta correcta
            agregarMensaje(estadoConfirmacion.respuestaCorrecta, false);
        } 
        else if (respuestaUsuario === 'no' || respuestaUsuario === 'n') {
            // Usuario niega → pedir reformular
            agregarMensaje("Entiendo. ¿Podrías reformular tu pregunta con más detalles? Así podré ayudarte mejor.", false);
        }
        else {
            // Respuesta no reconocida (ni sí ni no)
            agregarMensaje(`Por favor, responde con "sí" o "no". ¿Te referías a "${estadoConfirmacion.faqCandidata}"?`, false);
            // No desactivamos el estado, seguimos esperando sí/no
            return;
        }
        // Desactivar el estado después de procesar
        estadoConfirmacion.activo = false;
        estadoConfirmacion.preguntaOriginal = null;
        estadoConfirmacion.faqCandidata = null;
        estadoConfirmacion.respuestaCorrecta = null;
        return;
    }
    
    // --------------------------------------------------
    // CASO 2: Consulta normal (sin estado pendiente)
    // --------------------------------------------------
    const resultado = await buscarRespuesta(textoUsuario);
    
    // LOGS PARA DEPURACIÓN
    console.log('📦 resultado.tema recibido:', resultado.tema);
    
    if (resultado.necesitaConfirmacion) {
        // El tema ya viene limpio desde embeddings.js
        const temaLimpio = resultado.tema;
        
        // LOGS PARA DEPURACIÓN
        console.log('🧹 temaLimpio (ya viene limpio de embeddings):', temaLimpio);
        
        // Guardar estado y preguntar al usuario
        estadoConfirmacion.activo = true;
        estadoConfirmacion.preguntaOriginal = textoUsuario;
        estadoConfirmacion.faqCandidata = temaLimpio;
        estadoConfirmacion.respuestaCorrecta = resultado.respuestaCorrecta;
        
        const mensajeConfirmacion = `🤔 Te refieres a "${temaLimpio}". Responde "sí" o "no".`;
        agregarMensaje(mensajeConfirmacion, false);
    } 
    else {
        // Respuesta directa
        agregarMensaje(resultado.respuesta, false);
    }
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