// ============================================
// VISUAL - Mostrar pregunta y actualizar progreso
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario,
    setPreguntaActualIndex,
    modoSimulacro,
    tiempoTotalRestante, tiempoTotalConfigurado
} from '../estado.js';

import { generarOpciones } from './generador.js';
import { seleccionarOpcion, siguientePregunta } from './opciones.js';
import { iniciarTemporizadorGlobal } from './temporizador.js';
import { getIntervaloGlobal } from './globales.js';
import { mostrarResumenFinal } from './resumen.js';
import { getExamenGuardado, setExamenGuardado } from './inicio.js';
import { getFiltroLeyActual } from './inicio.js';

let intervaloGlobal = getIntervaloGlobal();

export function actualizarProgreso() {  // ← AGREGAR 'export'
    const progreso = document.getElementById('progreso-preguntas');
    const filtroLeyActual = getFiltroLeyActual();
    
    if (progreso) {
        let nombreMostrar = filtroLeyActual;
        
        const nombresCompetencias = {
            logicas: "Razonamiento lógico",
            lecturacritica: "Lectura Crítica",
            matematicas: "Matemáticas aplicadas",
            etica: "Ética profesional",
            orientacionservicio: "Orientación al Servicio",
            trabajoequipo: "Trabajo en Equipo"
        };
        nombreMostrar = nombresCompetencias[filtroLeyActual] || filtroLeyActual;
        
        progreso.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>📝 <strong>${nombreMostrar}</strong></span>
                <button onclick="window.comenzarNuevoExamen()" style="background:#dc3545; border:none; color:white; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:bold;">❌ Cancelar examen</button>            
            </div>
            <div style="margin-top:4px;">Pregunta ${preguntaActualIndex + 1} de ${preguntasActuales.length}</div>
        `;
        
        if (preguntaActualIndex > 0) {
            progreso.style.opacity = '0';
            progreso.style.transform = 'translateY(10px)';
            progreso.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => {
                progreso.style.opacity = '1';
                progreso.style.transform = 'translateY(0)';
            }, 50);
        }
    }
}

export function avanzarSiguientePregunta() {
    if (modoSimulacro) {
        const respuesta = respuestasUsuario[preguntaActualIndex];
        if (respuesta && !respuesta.respondida) {
            respuesta.respondida = true;
            respuesta.respuestaFinal = "No respondida";
            respuesta.intentos = 1;
            respuesta.esCorrecta = false;
        }
    }
    
    const newIndex = preguntaActualIndex + 1;
    setPreguntaActualIndex(newIndex);
    
    if (preguntaActualIndex < preguntasActuales.length) {
        if (modoSimulacro && tiempoTotalRestante > 0 && !intervaloGlobal) {
            iniciarTemporizadorGlobal();
            intervaloGlobal = getIntervaloGlobal();
        }
        mostrarPregunta();
        actualizarProgreso();
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        if (intervaloGlobal) {
            clearInterval(intervaloGlobal);
            intervaloGlobal = null;
        }
        setExamenGuardado(null);
        mostrarResumenFinal();
    }
}

export function mostrarPregunta() {
    if (preguntaActualIndex >= preguntasActuales.length) {
        setExamenGuardado(null);
        mostrarResumenFinal();
        return;
    }
    
    window.opcionSeleccionada = undefined;
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const respuesta = respuestasUsuario[preguntaActualIndex];
    
    if (!respuesta.opcionesMostradas) {
        respuesta.opcionesMostradas = generarOpciones(pregunta);
    }
    const opciones = respuesta.opcionesMostradas;
    
    const container = document.getElementById('preguntas-container');
    
    let temporizadorHtml = '';
    if (modoSimulacro && !respuesta.respondida) {
        const minutos = Math.floor(tiempoTotalRestante / 60);
        const segundos = tiempoTotalRestante % 60;
        const tiempoTexto = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        const progresoPorcentaje = (tiempoTotalRestante / tiempoTotalConfigurado) * 100;
        
        let colorBarra = '#0d6efd';
        if (progresoPorcentaje < 20) colorBarra = '#dc3545';
        else if (progresoPorcentaje < 50) colorBarra = '#ffc107';
        
        temporizadorHtml = `
            <div style="background-color: var(--bg-secundario); border-radius: 12px; padding: 12px; margin-bottom: 15px; border: 1px solid var(--borde);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 1rem;">⏱️ Tiempo total restante:</span>
                    <span id="temporizador-simulacro" style="font-size: 1.8rem; font-weight: bold; font-family: monospace; color: ${colorBarra};">${tiempoTexto}</span>
                </div>
                <div style="background-color: #e0e0e0; border-radius: 10px; height: 8px; overflow: hidden;">
                    <div id="barra-tiempo" style="background-color: ${colorBarra}; width: ${progresoPorcentaje}%; height: 100%; transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 0.75rem; margin-top: 5px; text-align: center; color: var(--texto-secundario);">
                    Pregunta ${preguntaActualIndex + 1} de ${preguntasActuales.length}
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="pregunta-card">
            ${temporizadorHtml}
            <div class="pregunta-texto">${pregunta.texto}</div>
            <div class="opciones" id="opciones-container">
    `;
    
    opciones.forEach((opcion, idx) => {
        const isDisabled = respuesta.respondida;
        const disabledAttr = isDisabled ? 'style="opacity:0.5; pointer-events:none;"' : '';
        const radioDisabled = isDisabled ? 'disabled' : '';
        const onclickAttr = isDisabled ? '' : `onclick="window.seleccionarOpcion(${idx})"`;
        
        html += `
            <div class="opcion" ${onclickAttr} ${disabledAttr}>
                <input type="radio" name="pregunta" id="opcion_${idx}" value="${opcion.texto.replace(/"/g, '&quot;')}" ${radioDisabled}>
                <label for="opcion_${idx}">${opcion.texto}</label>
            </div>
        `;
    });
    
    const feedbackHtml = (respuesta.respondida && !modoSimulacro) ? `
        <div id="feedback-${preguntaActualIndex}" class="feedback feedback-exito" style="display:block;">
            ✅ Correcto. ${respuesta.respuestaFinal}
        </div>
    ` : `<div id="feedback-${preguntaActualIndex}" class="feedback" style="display:none;"></div>`;
    
    let btnText, btnAction, btnStyle;
    if (modoSimulacro) {
        btnText = 'SIGUIENTE →';
        btnAction = 'window.avanzarSiguientePregunta()';
        btnStyle = (!respuesta.respondida && window.opcionSeleccionada === undefined) ? 'style="display: none;"' : '';
    } else {
        btnText = respuesta.respondida ? 'SIGUIENTE →' : 'VERIFICAR';
        btnAction = respuesta.respondida ? 'window.avanzarSiguientePregunta()' : 'window.siguientePregunta()';
        btnStyle = (!respuesta.respondida && window.opcionSeleccionada === undefined && !modoSimulacro) ? 'style="display: none;"' : '';
    }
    
    html += `
            </div>
            ${feedbackHtml}
            <button class="boton-siguiente" id="btn-siguiente" onclick="${btnAction}" ${btnStyle}>${btnText}</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    if (modoSimulacro && preguntaActualIndex === 0 && !intervaloGlobal && tiempoTotalRestante > 0) {
        iniciarTemporizadorGlobal();
        intervaloGlobal = getIntervaloGlobal();
    }
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    if (preguntaActualIndex > 0) {
        const preguntaCard = container.querySelector('.pregunta-card');
        if (preguntaCard) {
            preguntaCard.style.opacity = '0';
            preguntaCard.style.transform = 'translateY(20px)';
            preguntaCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => {
                preguntaCard.style.opacity = '1';
                preguntaCard.style.transform = 'translateY(0)';
            }, 350);
        }
    }
}

// Exponer funciones globales para onclick
window.seleccionarOpcion = seleccionarOpcion;
window.siguientePregunta = siguientePregunta;
window.avanzarSiguientePregunta = avanzarSiguientePregunta;