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
import { iniciarTemporizadorGlobal, actualizarTemporizadorGlobalVisual } from './temporizador.js';
import { getIntervaloGlobal } from './globales.js';
import { mostrarResumenFinal } from './resumen.js';
import { getExamenGuardado, setExamenGuardado } from './inicio.js';
import { getFiltroLeyActual } from './inicio.js';


let intervaloGlobal = null;

export function actualizarProgreso() {
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
        if (modoSimulacro && tiempoTotalRestante > 0) {
            let intervaloGlobalActual = getIntervaloGlobal();
            if (!intervaloGlobalActual) {
                console.log("🟢 Reiniciando temporizador para pregunta", preguntaActualIndex + 1);
                iniciarTemporizadorGlobal();
            } else {
                console.log("🟡 Temporizador ya activo, continuando...");
            }
        }
        mostrarPregunta();
        actualizarProgreso();
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        let intervaloGlobalActual = getIntervaloGlobal();
        if (intervaloGlobalActual) {
            clearInterval(intervaloGlobalActual);
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
    
    // ========================================
    // TEMPORIZADOR GLOBAL (solo simulacro)
    // ========================================
    let temporizadorHtml = '';
    if (modoSimulacro && !respuesta.respondida) {
        // NO llamar actualizarTemporizadorGlobalVisual() aquí (el elemento aún no existe)
        const minutos = Math.max(0, Math.floor(tiempoTotalRestante / 60));
        const segundos = Math.max(0, tiempoTotalRestante % 60);
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
    
    // ========================================
    // FONDO ALTERNADO ENTRE PREGUNTAS
    // ========================================
    const fondoAlternado = (preguntaActualIndex % 2 === 0) ? 'var(--bg-principal)' : 'var(--bg-secundario)';
    
    let html = `
        <div class="pregunta-card" style="background-color: ${fondoAlternado}; border-left: 4px solid var(--azul);">
            ${temporizadorHtml}
            <div class="pregunta-texto">${pregunta.texto}</div>
            <div class="opciones" id="opciones-container">
    `;
    
    opciones.forEach((opcion, idx) => {
        const isDisabled = respuesta.respondida;
        const disabledAttr = isDisabled ? 'style="opacity:0.5; pointer-events:none;"' : '';
        const radioDisabled = isDisabled ? 'disabled' : '';
        
        html += `
            <div class="opcion" ${disabledAttr}>
                <input type="radio" name="pregunta" id="opcion_${idx}" value="${opcion.texto.replace(/"/g, '&quot;')}" ${radioDisabled}
                       onchange="window.seleccionarOpcion(${idx})">
                <label for="opcion_${idx}" style="cursor: pointer;">${opcion.texto}</label>
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
    
    // ========================================
    // ACTUALIZAR VISUAL DEL TEMPORIZADOR (AHORA QUE EL ELEMENTO YA EXISTE)
    // ========================================
    if (modoSimulacro && !respuesta.respondida) {
        actualizarTemporizadorGlobalVisual();
    }
    
    // ========================================
// INICIAR TEMPORIZADOR (solo simulacro, primera pregunta, tiempo > 0)
// ========================================

    // Limpiar intervalo anterior si existe y estamos comenzando un nuevo examen
    if (modoSimulacro && preguntaActualIndex === 0 && intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
        console.log("🟡 Intervalo anterior limpiado para nuevo examen");
    }

    if (modoSimulacro && preguntaActualIndex === 0 && !intervaloGlobal && tiempoTotalRestante > 0) {
        console.log("🟢 Iniciando temporizador. Tiempo restante:", tiempoTotalRestante);
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