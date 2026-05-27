// ============================================
// INDEX - Punto de entrada del asistente (carga en el botón con relleno animado)
// ============================================

import { cargarConocimiento, suscribirProgreso, isModeloListo } from './datos.js';
import { toggleAsistente, procesarPregunta } from './core.js';

let cargaIniciada = false;
let esMovil = window.matchMedia("(max-width: 768px)").matches;

function guardarTextoOriginal(btn) {
    if (btn && !btn.dataset.textoOriginal) {
        const spanTexto = btn.querySelector('.boton-texto');
        btn.dataset.textoOriginal = spanTexto ? spanTexto.innerHTML : btn.innerHTML;
    }
}

function actualizarRelleno(btn, porcentaje) {
    const relleno = btn.querySelector('.boton-relleno');
    if (!relleno) return;
    if (esMovil) {
        // Horizontal: width = porcentaje%
        relleno.style.width = porcentaje + '%';
        relleno.style.height = '100%';
    } else {
        // Vertical: height = porcentaje%
        relleno.style.height = porcentaje + '%';
        relleno.style.width = '100%';
    }
    // Cambiar opacidad del botón para que no parezca deshabilitado de golpe
    if (porcentaje < 100) {
        btn.style.opacity = '0.9';
    } else {
        btn.style.opacity = '1';
    }
}

function actualizarTextoPorcentaje(btn, porcentaje) {
    const spanTexto = btn.querySelector('.boton-texto');
    if (spanTexto) {
        spanTexto.innerHTML = `🤖 ${Math.round(porcentaje)}%`;
    } else {
        btn.innerHTML = `🤖 ${Math.round(porcentaje)}%`;
    }
}

function restaurarTextoOriginal(btn) {
    if (btn && btn.dataset.textoOriginal) {
        const spanTexto = btn.querySelector('.boton-texto');
        if (spanTexto) {
            spanTexto.innerHTML = btn.dataset.textoOriginal;
        } else {
            btn.innerHTML = btn.dataset.textoOriginal;
        }
    }
}

function actualizarBotonProgreso(porcentaje) {
    const btnPC = document.getElementById('asistente-btn');
    const btnHeader = document.getElementById('aiBtn');
    const botones = [btnPC, btnHeader].filter(b => b);
    
    botones.forEach(btn => {
        guardarTextoOriginal(btn);
        actualizarTextoPorcentaje(btn, porcentaje);
        actualizarRelleno(btn, porcentaje);
        btn.disabled = true;
    });
}

function habilitarBotones() {
    const btnPC = document.getElementById('asistente-btn');
    const btnHeader = document.getElementById('aiBtn');
    const botones = [btnPC, btnHeader].filter(b => b);
    
    botones.forEach(btn => {
        // Restaurar el texto original
        restaurarTextoOriginal(btn);
        
        // Ocultar el relleno (ya no se necesita)
        const relleno = btn.querySelector('.boton-relleno');
        if (relleno) {
            relleno.style.display = 'none';   // Desaparece completamente
            // Opcional: eliminar cualquier estilo inline que se haya añadido
            relleno.style.animation = '';
            relleno.style.background = '';
            relleno.style.width = '';
            relleno.style.height = '';
        }
        
        // Habilitar el botón y restaurar opacidad normal
        btn.disabled = false;
        btn.style.opacity = '1';
        // Eliminar cualquier estilo inline residual del botón
        btn.style.background = '';
        btn.style.backgroundColor = '';
    });
    console.log('✅ Asistente listo. Botones habilitados y relleno oculto.');
}

function deshabilitarBotonesInicio() {
    const btnPC = document.getElementById('asistente-btn');
    const btnHeader = document.getElementById('aiBtn');
    const botones = [btnPC, btnHeader].filter(b => b);
    
    botones.forEach(btn => {
        guardarTextoOriginal(btn);
        actualizarTextoPorcentaje(btn, 0);
        actualizarRelleno(btn, 0);
        btn.disabled = true;
        btn.style.opacity = '0.9';
    });
}

export async function initAsistente() {
    if (cargaIniciada) return;
    cargaIniciada = true;
    
    esMovil = window.matchMedia("(max-width: 768px)").matches;
    
    // Deshabilitar botones al inicio
    deshabilitarBotonesInicio();
    
    // Suscribirse al progreso
    suscribirProgreso((porcentaje) => {
        actualizarBotonProgreso(porcentaje);
        if (porcentaje >= 100) {
            habilitarBotones();
        }
    });
    
    // Iniciar carga real
    cargarConocimiento().catch(error => {
        console.error('Error en carga del asistente:', error);
        habilitarBotones();
    });
    
    // Asignar eventos (solo una vez)
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

// Exportar para uso global
window.initAsistente = initAsistente;
window.toggleAsistente = toggleAsistente;