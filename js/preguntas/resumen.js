// ============================================
// RESUMEN - Mostrar resultados finales
// ============================================

import { 
    preguntasActuales, respuestasUsuario,
    modoSimulacro, setTemporizadorActivo,
    variablesEvaluacion
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
    
    // Calcular tiempo usado (solo simulacro)
    if (modoSimulacro && tiempoInicioSimulacro) {
        tiempoUsadoSegundos = Math.floor((Date.now() - tiempoInicioSimulacro) / 1000);
    }
    
    // Usar variablesEvaluacion para el tiempo total configurado
    const tiempoTotalConfigurado = modoSimulacro ? (variablesEvaluacion.tiempoTotal || 6000) : 300;
    const minutosUsados = Math.floor(tiempoUsadoSegundos / 60);
    const segundosUsados = tiempoUsadoSegundos % 60;
    const minutosTotal = Math.floor(tiempoTotalConfigurado / 60);
    const segundosTotal = tiempoTotalConfigurado % 60;
    const tiempoPromedio = (tiempoUsadoSegundos / totalPreguntas).toFixed(1);
    
    // ========================================
    // CONSTRUIR HTML SEGÚN MODO
    // ========================================
    
    let html = '';
    
    // === CARD DE PUNTAJE SIMO ===
    html += `
        <hr style="border: 1px solid var(--borde); margin: 12px 0;">
        <div class="pregunta-card" style="background-color: ${aprobo ? '#d4edda' : '#f8d7da'}; border: 2px solid ${aprobo ? '#28a745' : '#dc3545'}; margin-bottom: 20px;">
            <div style="text-align: center;">
                <h3 style="margin: 0 0 10px 0;">📊 RESULTADO SIMO (en %)</h3>
                <div style="font-size: 2.5rem; font-weight: bold;">${puntajeFinal}% <span style="font-size: 1rem; font-weight: normal;">(${puntajeFinal}/100)</span></div>
                <div style="font-size: 1.1rem; margin: 5px 0;">✅ Aciertos: ${aciertos} de ${totalPreguntas} (${Math.round((aciertos/totalPreguntas)*100)}%)</div>
                <div style="font-size: 1.1rem;">🎯 Corte de aprobación SIMO: ${corteAprobatorio}/100</div>
                <div style="font-size: 1.3rem; font-weight: bold; margin-top: 10px; color: ${aprobo ? '#28a745' : '#dc3545'};">
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
    
    // === TIEMPOS (solo simulacro) ===
    if (modoSimulacro) {
        html += `
            <div class="pregunta-card" style="margin-bottom: 20px;">
                <h3>⏱️ TIEMPOS</h3>
                <p>Tiempo total: ${minutosUsados.toString().padStart(2,'0')}:${segundosUsados.toString().padStart(2,'0')} / ${minutosTotal.toString().padStart(2,'0')}:${segundosTotal.toString().padStart(2,'0')}</p>
                <p>Tiempo promedio por pregunta: ${tiempoPromedio} segundos</p>
            </div>
        `;
    }
    
    // === MODO ESTUDIO: Tabla completa ===
    if (!modoSimulacro) {
        html += `<div class="pregunta-card" id="resumen-scroll" style="background-color: rgba(13, 110, 253, 0.1); border: 2px solid var(--azul); margin-top: 20px;">
                <h3>📋 RESUMEN DE LA ACTIVIDAD</h3>
                <hr style="border: 1px solid var(--borde); margin: 12px 0;">
        `;
        
        for (let idx = 0; idx < totalPreguntas; idx++) {
            const pregunta = preguntasActuales[idx];
            const respuesta = respuestasUsuario[idx];
            
            let textoCorrecto = '';
            if (respuesta.opcionesMostradas) {
                const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
                if (opcionCorrecta) {
                    textoCorrecto = opcionCorrecta.texto;
                }
            }
            
            const esCorrectaEnTabla = (respuesta.intentos === 1);
            const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
            const textoIntentos = (!modoSimulacro && respuesta.intentos > 1) ? ` (${respuesta.intentos} intentos)` : '';
            
            const bgColor = esCorrectaEnTabla ? '#d4edda' : '#f8d7da';
            const borderColor = esCorrectaEnTabla ? '#28a745' : '#dc3545';
            const estadoTexto = esCorrectaEnTabla ? '✅ Correcta' : '❌ Incorrecta';
            
            html += `
                <div style="padding: 12px; margin-bottom: 10px; border-radius: 10px; background-color: ${bgColor}; border-left: 4px solid ${borderColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
                        <p style="font-weight: bold; font-size: 1rem; margin: 0;">📌 Pregunta ${idx + 1}</p>
                        <p style="font-size: 0.85rem; margin: 0; font-weight: bold; color: ${borderColor};">${estadoTexto}</p>
                    </div>
                    <p style="font-size: 0.95rem; margin: 5px 0;"><strong>${pregunta.texto}</strong></p>
                    <p style="font-size: 0.9rem; margin: 5px 0;">Tu respuesta: <strong>${textoRespuesta}</strong>${textoIntentos}</p>`;
            
            if (!esCorrectaEnTabla && textoCorrecto) {
                html += `<p style="font-size: 0.85rem; margin: 5px 0; color: #28a745;">✅ Respuesta correcta: <strong>${textoCorrecto}</strong></p>`;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
    }
    
    // === MODO SIMULACRO: Preguntas falladas colapsable ===
    if (modoSimulacro) {
        // Construir HTML de preguntas falladas
        let falladasHtml = '';
        let falladasCount = 0;
        
        for (let idx = 0; idx < totalPreguntas; idx++) {
            const pregunta = preguntasActuales[idx];
            const respuesta = respuestasUsuario[idx];
            const esCorrecta = respuesta.esCorrecta === true;
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
        
        if (falladasCount > 0) {
            html += `
                <div class="pregunta-card" style="margin-top: 20px;">
                    <button id="btn-toggle-falladas" class="boton-reiniciar" style="background-color: #6c757d; width: 100%; display: flex; justify-content: space-between; align-items: center;" onclick="toggleFalladas()">
                        <span>🔍 VER PREGUNTAS FALLADAS (${falladasCount})</span>
                        <span id="toggle-icon">▼</span>
                    </button>
                    <div id="falladas-container" style="display: none; margin-top: 10px; max-height: 400px; overflow-y: auto;">
                        ${falladasHtml}
                    </div>
                </div>
            `;
            
            // RECOMENDACIÓN PARA EL USUARIO
            html += `
                <div class="pregunta-card" style="margin-top: 15px; background-color: rgba(255, 193, 7, 0.15); border-left: 4px solid #ffc107;">
                    <div style="padding: 12px;">
                        <p style="margin: 0; font-size: 0.9rem;">
                            💡 <strong>Recomendación:</strong> Para reforzar estos temas, practica en el 
                            <strong>Modo Estudio</strong> con la misma competencia. Allí recibirás explicaciones 
                            detalladas y podrás aprender sin presión.
                        </p>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="pregunta-card" style="margin-top: 20px; text-align: center; background-color: rgba(25, 135, 84, 0.15);">
                    <p>🎉 ¡EXCELENTE! No tuviste preguntas falladas.</p>
                </div>
            `;
        }
    }
    
    // === BOTONES DE ACCIÓN ===
    html += `
        <hr style="border: 1px solid var(--borde); margin: 20px 0;">
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
            ${modoSimulacro ? '<button class="boton-reiniciar" onclick="window.exportarResultadosPDF()" style="background-color: #17a2b8;">📥 EXPORTAR RESULTADOS</button>' : ''}
            <button class="boton-reiniciar" onclick="window.inicializarPreguntas(\'' + getFiltroLeyActual() + '\')">🔄 REPETIR EXAMEN</button>
            <button class="boton-reiniciar" onclick="window.comenzarNuevoExamen()">📋 CAMBIAR DE COMPETENCIA</button>
        </div>
    `;
    
    // Botón subir para scroll
    html += `
        <button id="btn-subir-resumen" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑</button>
    `;
    
    container.innerHTML = html;
    
    setTimeout(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, 100);
    
    // Mostrar botón subir al hacer scroll
    setTimeout(() => {
        const btnSubir = document.getElementById('btn-subir-resumen');
        if (btnSubir) {
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
    
    import('./inicio.js').then(module => {
        module.setFiltroLeyActual('');
        module.mostrarInicioPreguntas();
    });
    
    import('./ui.js').then(module => {
        module.restaurarContenidoDescriptivo();
    });
}