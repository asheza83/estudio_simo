// ============================================
// INICIO - Pantalla inicial y verificación
// ============================================

import { inicializarSelectsCompetencias } from './selects.js';
import { leyesDisponibles } from '../estado.js';

let filtroLeyActual = '';
let examenGuardado = null;

export function getFiltroLeyActual() {
    return filtroLeyActual;
}

export function setFiltroLeyActual(valor) {
    filtroLeyActual = valor;
}

export function getExamenGuardado() {
    return examenGuardado;
}

export function setExamenGuardado(valor) {
    examenGuardado = valor;
}

export function mostrarInicioPreguntas() {
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    
    if (inicio) inicio.style.display = 'block';
    if (examen) examen.style.display = 'none';
    
    filtroLeyActual = '';
    examenGuardado = null;
    
    inicializarSelectsCompetencias();
}

function mostrarModalContinuar() {
    const container = document.getElementById('preguntas-examen');
    const inicio = document.getElementById('preguntas-inicio');
    
    if (inicio) inicio.style.display = 'none';
    if (container) container.style.display = 'block';
    
    const ley = leyesDisponibles.find(l => l.id === examenGuardado.leyId);
    const nombreLey = ley ? ley.nombre : examenGuardado.leyId;
    
    container.innerHTML = `
        <div class="pregunta-card" style="text-align: center;">
            <h3>📝 Tienes un examen guardado</h3>
            <p style="margin: 12px 0;"><strong>${nombreLey}</strong></p>
            <p style="margin: 8px 0;">Pregunta ${examenGuardado.preguntaIndex + 1} de ${examenGuardado.totalPreguntas}</p>
            <hr style="border: 1px solid var(--borde); margin: 16px 0;">
            <button class="boton-reiniciar" onclick="window.continuarExamen()" style="margin-bottom: 10px;">▶ CONTINUAR EXAMEN</button>
            <button class="boton-reiniciar" onclick="window.comenzarNuevoExamen()">🔄 COMENZAR NUEVO</button>
        </div>
    `;
}

export function verificarExamenGuardado() {
    if (examenGuardado) {
        mostrarModalContinuar();
    } else {
        mostrarInicioPreguntas();
    }
}

// ============================================
// EXPOSICIÓN GLOBAL (para onclick en HTML)
// ============================================
window.getFiltroLeyActual = getFiltroLeyActual;
window.setFiltroLeyActual = setFiltroLeyActual;
window.mostrarInicioPreguntas = mostrarInicioPreguntas;
window.verificarExamenGuardado = verificarExamenGuardado;