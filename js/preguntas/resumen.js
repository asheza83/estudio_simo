// ============================================
// RESUMEN - Mostrar resultados finales
// ============================================

import { 
    preguntasActuales, respuestasUsuario,
    modoSimulacro, setTemporizadorActivo,
    PREGUNTAS_POR_SESION
} from '../estado.js';

import { getFiltroLeyActual, setExamenGuardado } from './inicio.js';
import { getIntervaloGlobal, setIntervaloGlobal } from './globales.js';
import { exportarResultadosPDF } from './pdf.js';

let tiempoInicioSimulacro = null;
let tiempoUsadoSegundos = null;

export function setTiempoInicioSimulacro(valor) {
    tiempoInicioSimulacro = valor;
}

export function getTiempoUsadoSegundos() {
    return tiempoUsadoSegundos;
}

export function setTiempoUsadoSegundos(valor) {
    tiempoUsadoSegundos = valor;
}

// Función global para toggle de preguntas falladas
window.toggleFalladas = function() {
    const container = document.getElementById('falladas-container');
    const icon = document.getElementById('toggle-icon');
    if (container) {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            if (icon) icon.textContent = '▲';
        } else {
            container.style.display = 'none';
            if (icon) icon.textContent = '▼';
        }
    }
};

export function mostrarResumenFinal() {
    // DETENER TEMPORIZADOR GLOBAL SI ESTÁ ACTIVO
    let intervaloGlobal = getIntervaloGlobal();
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        setIntervaloGlobal(null);
        setTemporizadorActivo(false);
    }
    
    const container = document.getElementById('preguntas-container');
    const examenDiv = document.getElementById('preguntas-examen');
    const filtroLeyActual = getFiltroLeyActual();
    
    if (examenDiv) examenDiv.style.display = 'block';
    
    const progreso = document.getElementById('progreso-preguntas');
    if (progreso) progreso.innerHTML = '';
    
    // ========================================
    // CÁLCULO DE ACIERTOS
    // ========================================
    let aciertos = 0;
    const totalPreguntas = preguntasActuales.length;
    
    for (let idx = 0; idx < totalPreguntas; idx++) {
        const respuesta = respuestasUsuario[idx];
        
        let esAcierto = false;
        
        if (modoSimulacro) {
            esAcierto = (respuesta.esCorrecta === true);
        } else {
            esAcierto = (respuesta.intentos === 1);
        }
        
        if (esAcierto) {
            aciertos++;
        }
    }
    
    // Calcular puntaje SIMO (sobre 100)
    const puntajeFinal = Math.round((aciertos / totalPreguntas) * 100);
    const corteAprobatorio = 70;
    const aprobo = puntajeFinal >= corteAprobatorio;
    
    // ========================================
    // HTML DEL RESUMEN
    // ========================================

    // Calcular tiempo usado (solo simulacro)
    tiempoUsadoSegundos = null;
    let tiempoPromedio = null;
    if (modoSimulacro && tiempoInicioSimulacro) {
        tiempoUsadoSegundos = Math.floor((Date.now() - tiempoInicioSimulacro) / 1000);
        const tiempoTotalConfigurado = PREGUNTAS_POR_SESION * 60;
        if (tiempoTotalConfigurado) {
            tiempoPromedio = (tiempoUsadoSegundos / preguntasActuales.length).toFixed(1);
        }
    }

    let html = `
        <hr style="border: 1px solid var(--borde); margin: 12px 0;">
        <p style="text-align: center; font-size: 1.2rem; color: var(--texto-secundario); margin-bottom: 12px; line-height: 1.4;">
            En esta sección encontrará una Tabla de Resumen de su actividad que contiene: Cada pregunta respondida, si fue correcta o incorrecta, la respuesta correcta y los intentos realizados.<br><br>
            💡 <strong>¿Qué hacer ahora?</strong><br>
            En la parte inferior encontrará dos botones:<br>
            • <strong>"REPETIR EXAMEN"</strong> - Carga nuevas preguntas de la misma competencia.<br>
            • <strong>"CAMBIAR DE COMPETENCIA"</strong> - Vuelve a los selectores de Tipo de Competencia y Subcategoría en la pestaña Preguntas.
        </p>
    `;

    // === CARD DE PUNTAJE SIMO ===
    html += `
        <div class="pregunta-card" style="background-color: ${aprobo ? 'rgba(25, 135, 84, 0.15)' : 'rgba(220, 53, 69, 0.15)'}; border: 2px solid ${aprobo ? 'var(--exito)' : 'var(--error)'}; margin-bottom: 20px;">
            <div style="text-align: center;">
                <h3 style="margin: 0 0 10px 0;">📊 RESULTADO SIMO (en %)</h3>
                <div style="font-size: 2.5rem; font-weight: bold;">${puntajeFinal}% <span style="font-size: 1rem; font-weight: normal;">(${puntajeFinal}/100)</span></div>
                <div style="font-size: 1.1rem; margin: 5px 0;">✅ Aciertos: ${aciertos} de ${totalPreguntas}</div>
                <div style="font-size: 1.1rem;">🎯 Corte de aprobación SIMO: ${corteAprobatorio}/100</div>
                <div style="font-size: 1.3rem; font-weight: bold; margin-top: 10px; color: ${aprobo ? 'var(--exito)' : 'var(--error)'};">
                    ${aprobo ? '🟢 RESULTADO: APROBÓ' : '🔴 RESULTADO: REPROBÓ'}
                </div>
                <div style="font-size: 0.9rem; margin-top: 8px;">
                    ${modoSimulacro ? '⏱️ Modo Simulacro' : '📚 Modo Estudio'}
                </div>
                <div style="font-size: 0.8rem; margin-top: 8px; color: var(--texto-secundario);">
                    ℹ️ El puntaje SIMO se calcula como: (Aciertos / Total preguntas) × 100
                </div>
            </div>
        </div>
    `;

    // Tabla de respuestas detalladas
    html += `<div class="pregunta-card" id="resumen-scroll" style="background-color: rgba(13, 110, 253, 0.1); border: 2px solid var(--azul); margin-top: 20px;">
            <h3>📋 RESUMEN DE LA ACTIVIDAD</h3>
            <hr style="border: 1px solid var(--borde); margin: 12px 0;">
    `;
    
    for (let idx = 0; idx < totalPreguntas; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        
        // Buscar opción correcta
        let textoCorrecto = '';
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            if (opcionCorrecta) {
                textoCorrecto = opcionCorrecta.texto;
            }
        }
        
        let esCorrectaEnTabla = false;
        if (modoSimulacro) {
            esCorrectaEnTabla = (respuesta.esCorrecta === true);
        } else {
            esCorrectaEnTabla = (respuesta.intentos === 1);
        }
        
        const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
        const textoIntentos = (!modoSimulacro && respuesta.intentos > 1) ? ` (${respuesta.intentos} intentos)` : '';
        
        const bgColor = esCorrectaEnTabla ? 'rgba(25, 135, 84, 0.50)' : 'rgba(220, 53, 69, 0.50)';
        const borderColor = esCorrectaEnTabla ? 'var(--exito)' : 'var(--error)';
        const estadoTexto = esCorrectaEnTabla ? '✅ Correcta' : '❌ Incorrecta';
        
        html += `
            <div style="padding: 12px; margin-bottom: 10px; border-radius: 10px; background-color: ${bgColor}; border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
                    <p style="font-weight: bold; font-size: 1rem; margin: 0;">📌 Pregunta ${idx + 1}</p>
                    <p style="font-size: 0.85rem; margin: 0; font-weight: bold; color: ${esCorrectaEnTabla ? 'var(--exito)' : 'var(--error)'};">${estadoTexto}</p>
                </div>
                <p style="font-size: 0.95rem; margin: 5px 0;"><strong>${pregunta.texto}</strong></p>
                <p style="font-size: 0.9rem; margin: 5px 0;">Tu respuesta: <strong>${textoRespuesta}</strong>${textoIntentos}</p>`;
        
        if (!esCorrectaEnTabla && textoCorrecto) {
            html += `<p style="font-size: 0.85rem; margin: 5px 0; color: var(--exito);">✅ Respuesta correcta: <strong>${textoCorrecto}</strong></p>`;
        }
        
        html += `</div>`;
    }
    
    // Construir HTML de preguntas falladas (para el toggle)
    let falladasHtml = '';
    let falladasCount = 0;
    for (let idx = 0; idx < totalPreguntas; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        const esCorrecta = modoSimulacro ? (respuesta.esCorrecta === true) : (respuesta.intentos === 1);
        if (esCorrecta) continue;
        falladasCount++;
        
        let textoCorrecto = '';
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            if (opcionCorrecta) textoCorrecto = opcionCorrecta.texto;
        }
        const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
        
        falladasHtml += `
            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <strong>Pregunta ${idx + 1}:</strong> ${pregunta.texto}<br>
                <strong>Tu respuesta:</strong> ${textoRespuesta}<br>
                <strong>Respuesta correcta:</strong> ${textoCorrecto}
            </div>
        `;
    }
    
    // Botón de preguntas falladas (colapsable) para simulacro - CORREGIDO con onclick
    if (modoSimulacro && falladasCount > 0) {
        html += `
            <div style="margin-top: 20px;">
                <button id="btn-toggle-falladas" class="boton-reiniciar" style="background-color: #6c757d; width: 100%; display: flex; justify-content: space-between; align-items: center;" onclick="toggleFalladas()">
                    <span>🔍 VER PREGUNTAS FALLADAS (${falladasCount})</span>
                    <span id="toggle-icon">▼</span>
                </button>
                <div id="falladas-container" style="display: none; margin-top: 10px; max-height: 400px; overflow-y: auto;">
                    ${falladasHtml}
                </div>
            </div>
        `;
    }
    
    // Botones de acción (fila horizontal)
    html += `
        <hr style="border: 1px solid var(--borde); margin: 20px 0;">
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
            ${modoSimulacro ? '<button class="boton-reiniciar" onclick="window.exportarResultadosPDF()" style="background-color: #17a2b8;">📥 EXPORTAR RESULTADOS</button>' : ''}
            <button class="boton-reiniciar" onclick="window.inicializarPreguntas(\'' + getFiltroLeyActual() + '\')">🔄 REPETIR EXAMEN</button>
            <button class="boton-reiniciar" onclick="window.comenzarNuevoExamen()">📋 CAMBIAR DE COMPETENCIA</button>
        </div>
    `;
    
    html += `
        </div>
        <button id="btn-subir-resumen" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="document.getElementById('resumen-scroll').scrollIntoView({behavior:'smooth'})">↑</button>
    `;
    
    container.innerHTML = html;
    
    setTimeout(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, 100);
    
    setTimeout(() => {
        const resumenScroll = document.getElementById('resumen-scroll');
        const btnSubir = document.getElementById('btn-subir-resumen');
        
        if (resumenScroll && btnSubir) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 150) {
                    btnSubir.style.display = 'block';
                } else {
                    btnSubir.style.display = 'none';
                }
            });
        }
    }, 100);
}

export function volverAInicioPreguntas() {
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    
    if (inicio) inicio.style.display = 'block';
    if (examen) examen.style.display = 'none';
    
    setExamenGuardado(null);
    
    // Importar dinámicamente para evitar circularidad
    import('./inicio.js').then(module => {
        module.setFiltroLeyActual('');
        module.mostrarInicioPreguntas();
    });
    
    import('./ui.js').then(module => {
        module.restaurarContenidoDescriptivo();
    });
}