// ============================================
// GUARDADO - Guardar/Descartar examen al cambiar pestaña
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario
} from '../estado.js';

import { setFiltroLeyActual, getFiltroLeyActual, setExamenGuardado, getExamenGuardado, mostrarInicioPreguntas } from './inicio.js';
import { restaurarContenidoDescriptivo } from './ui.js';

let filtroLeyActual = getFiltroLeyActual();
let examenGuardado = getExamenGuardado();

export function preguntarGuardarExamen() {
    if (preguntasActuales.length === 0 || preguntaActualIndex >= preguntasActuales.length) {
        return false;
    }
    
    const container = document.getElementById('preguntas-examen');
    if (container) container.style.display = 'block';
    
    const nombreExamen = filtroLeyActual;
    
    container.innerHTML = `
        <div class="pregunta-card" style="text-align: center;">
            <h3>⚠️ Tienes un examen en curso</h3>
            <p style="margin: 12px 0;"><strong>${nombreExamen}</strong></p>
            <p style="margin: 8px 0;">Pregunta ${preguntaActualIndex + 1} de ${preguntasActuales.length}</p>
            <p style="margin: 12px 0;">¿Qué deseas hacer?</p>
            <hr style="border: 1px solid var(--borde); margin: 16px 0;">
            <button class="boton-reiniciar" onclick="window.guardarExamen()" style="margin-bottom: 10px;">💾 GUARDAR AVANCE</button>
            <button class="boton-reiniciar" onclick="window.descartarExamen()">🗑️ DESCARTAR EXAMEN</button>
        </div>
    `;
    
    return true;
}

export function guardarExamen() {
    setExamenGuardado({
        leyId: filtroLeyActual,
        preguntas: [...preguntasActuales],
        preguntaIndex: preguntaActualIndex,
        respuestas: respuestasUsuario.map(r => ({...r})),
        totalPreguntas: preguntasActuales.length
    });
}

export function descartarExamen() {
    setExamenGuardado(null);
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    setFiltroLeyActual('');
    
    restaurarContenidoDescriptivo();
    mostrarInicioPreguntas();
}

// Exponer funciones globales para onclick
window.preguntarGuardarExamen = preguntarGuardarExamen;
window.guardarExamen = guardarExamen;
window.descartarExamen = descartarExamen;