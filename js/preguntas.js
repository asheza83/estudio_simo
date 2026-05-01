// ============================================
// MÓDULO: preguntas.js
// Sistema completo de preguntas (v6 - CORREGIDO)
// ============================================

import { 
    preguntasBanco, preguntasActuales, preguntaActualIndex, respuestasUsuario,
    PREGUNTAS_POR_SESION,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario
} from './estado.js';
import { leyesDisponibles } from './estado.js';

let filtroLeyActual = '';
let examenGuardado = null;

// ============================================
// PANTALLA INICIAL - SELECTOR DE LEY
// ============================================
export function mostrarInicioPreguntas() {
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    
    if (inicio) inicio.style.display = 'block';
    if (examen) examen.style.display = 'none';
    
    filtroLeyActual = '';
    examenGuardado = null;
    
    const select = document.getElementById('filtro-ley-inicio');
    if (select) {
        select.innerHTML = '<option value="">📋 Selecciona las preguntas a realizar...</option>';
        leyesDisponibles.forEach(ley => {
            select.innerHTML += `<option value="${ley.id}">${ley.nombre}</option>`;
        });
        
        // Remover event listeners previos para evitar duplicados
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        newSelect.addEventListener('change', function() {
            const btn = document.getElementById('btn-comenzar-examen');
            filtroLeyActual = this.value;
            if (btn) {
                btn.disabled = (this.value === '' || this.value === null);
            }
        });
    }
    
    const btn = document.getElementById('btn-comenzar-examen');
    if (btn) {
        btn.disabled = true;
        filtroLeyActual = '';
    }
}

// ============================================
// VERIFICAR SI HAY EXAMEN GUARDADO AL ENTRAR
// ============================================
export function verificarExamenGuardado() {
    if (examenGuardado) {
        mostrarModalContinuar();
    } else {
        mostrarInicioPreguntas();
    }
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

// ============================================
// COMENZAR NUEVO EXAMEN
// ============================================
export function inicializarPreguntas(leyFiltro = null) {
    if (!leyFiltro) {
        const select = document.getElementById('filtro-ley-inicio');
        leyFiltro = select ? select.value : filtroLeyActual;
    }
    
    if (!leyFiltro) return;
    
    filtroLeyActual = leyFiltro;
    examenGuardado = null;
    
    if (!preguntasBanco || preguntasBanco.length === 0) {
        document.getElementById('preguntas-container').innerHTML = '<p>❌ Error: No hay preguntas disponibles.</p>';
        return;
    }
    
    const preguntasDisponibles = preguntasBanco.filter(p => p.leyReferencia === filtroLeyActual);
    
    if (preguntasDisponibles.length === 0) {
        document.getElementById('preguntas-container').innerHTML = '<p>❌ No hay preguntas disponibles para esta norma.</p>';
        return;
    }
    
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    if (inicio) inicio.style.display = 'none';
    if (examen) examen.style.display = 'block';
    
    const preguntasMezcladas = [...preguntasDisponibles].sort(() => Math.random() - 0.5);
    const nuevasPreguntas = preguntasMezcladas.slice(0, PREGUNTAS_POR_SESION);
    setPreguntasActuales(nuevasPreguntas);
    setPreguntaActualIndex(0);
    setRespuestasUsuario(nuevasPreguntas.map(() => ({
        intentos: 0,
        respondida: false,
        respuestaFinal: null,
        opcionesMostradas: null
    })));
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    mostrarPregunta();
    actualizarProgreso();
}

export function comenzarNuevoExamen() {
    examenGuardado = null;
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    filtroLeyActual = '';
    volverAInicioPreguntas();
}

export function continuarExamen() {
    if (!examenGuardado) {
        mostrarInicioPreguntas();
        return;
    }
    
    filtroLeyActual = examenGuardado.leyId;
    
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    if (inicio) inicio.style.display = 'none';
    if (examen) examen.style.display = 'block';
    
    setPreguntasActuales(examenGuardado.preguntas);
    setPreguntaActualIndex(examenGuardado.preguntaIndex);
    setRespuestasUsuario(examenGuardado.respuestas);
    examenGuardado = null;
    
    mostrarPregunta();
    actualizarProgreso();
}

// ============================================
// GUARDAR O DESCARTAR AL CAMBIAR DE PESTAÑA
// ============================================
export function preguntarGuardarExamen() {
    if (preguntasActuales.length === 0 || preguntaActualIndex >= preguntasActuales.length) {
        return false;
    }
    
    const container = document.getElementById('preguntas-examen');
    if (container) container.style.display = 'block';
    
    const ley = leyesDisponibles.find(l => l.id === filtroLeyActual);
    const nombreLey = ley ? ley.nombre : filtroLeyActual;
    
    container.innerHTML = `
        <div class="pregunta-card" style="text-align: center;">
            <h3>⚠️ Tienes un examen en curso</h3>
            <p style="margin: 12px 0;"><strong>${nombreLey}</strong></p>
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
    examenGuardado = {
        leyId: filtroLeyActual,
        preguntas: [...preguntasActuales],
        preguntaIndex: preguntaActualIndex,
        respuestas: respuestasUsuario.map(r => ({...r})),
        totalPreguntas: preguntasActuales.length
    };
}

export function descartarExamen() {
    examenGuardado = null;
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    filtroLeyActual = '';
    volverAInicioPreguntas();
}

// ============================================
// SELECCIONAR OPCIÓN
// ============================================
export function seleccionarOpcion(indice) {
    const respuesta = respuestasUsuario[preguntaActualIndex];
    if (respuesta.respondida) return;
    
    document.getElementById('btn-siguiente').disabled = false;
    window.opcionSeleccionada = indice;
}

// ============================================
// VERIFICAR RESPUESTA
// ============================================
export function siguientePregunta() {
    const respuesta = respuestasUsuario[preguntaActualIndex];
    
    // Evitar verificar si ya respondió
    if (respuesta.respondida) return;
    
    if (window.opcionSeleccionada === undefined) return;
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const opcionSeleccionada = respuesta.opcionesMostradas[window.opcionSeleccionada];
    
    respuesta.intentos++;
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    
    if (opcionSeleccionada.esCorrecta) {
        respuesta.respondida = true;
        respuesta.respuestaFinal = opcionSeleccionada.texto;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-exito';
        feedbackDiv.innerHTML = `✅ Correcto. ${opcionSeleccionada.feedback}`;
        
        document.querySelectorAll('.opcion').forEach(el => {
            el.style.opacity = '0.6';
            el.style.pointerEvents = 'none';
        });
        
        const btn = document.getElementById('btn-siguiente');
        btn.textContent = 'SIGUIENTE →';
        btn.onclick = () => avanzarSiguientePregunta();
        
    } else {
        let mensajeFeedback = `${opcionSeleccionada.feedback}<br><br>🔄 Intenta de nuevo con las opciones restantes.`;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-error';
        feedbackDiv.innerHTML = mensajeFeedback;
        
        document.getElementById('btn-siguiente').disabled = true;
        const opcionesDiv = document.querySelectorAll('.opcion');
        opcionesDiv[window.opcionSeleccionada].style.opacity = '0.5';
        opcionesDiv[window.opcionSeleccionada].style.pointerEvents = 'none';
        window.opcionSeleccionada = undefined;
    }
}

// ============================================
// GENERAR OPCIONES
// ============================================
function generarOpciones(pregunta) {
    const correcta = pregunta.respuestaCorrecta;
    const distractores = pregunta.distractores || [];
    
    const opciones = [
        { texto: correcta, esCorrecta: true, feedback: pregunta.explicacion },
        ...distractores.map(d => ({
            texto: d,
            esCorrecta: false,
            feedback: `❌ Incorrecto. "${d}" no es la respuesta correcta.`
        }))
    ];
    
    return opciones.sort(() => Math.random() - 0.5);
}

// ============================================
// MOSTRAR PREGUNTA
// ============================================
function mostrarPregunta() {
    if (preguntaActualIndex >= preguntasActuales.length) {
        examenGuardado = null;
        mostrarResumenFinal();
        return;
    }
    
    // Limpiar selección anterior
    window.opcionSeleccionada = undefined;
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const respuesta = respuestasUsuario[preguntaActualIndex];
    
    // Generar opciones SOLO si no existen
    if (!respuesta.opcionesMostradas) {
        respuesta.opcionesMostradas = generarOpciones(pregunta);
    }
    const opciones = respuesta.opcionesMostradas;
    
    const container = document.getElementById('preguntas-container');
    
    let html = `
        <div class="pregunta-card">
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
    
    // Mostrar feedback si ya respondió
    const feedbackHtml = respuesta.respondida ? `
        <div id="feedback-${preguntaActualIndex}" class="feedback feedback-exito" style="display:block;">
            ✅ Correcto. ${respuesta.respuestaFinal}
        </div>
    ` : `<div id="feedback-${preguntaActualIndex}" class="feedback" style="display:none;"></div>`;
    
    const btnDisabled = respuesta.respondida ? 'disabled' : '';
    const btnText = respuesta.respondida ? 'SIGUIENTE →' : 'VERIFICAR';
    const btnAction = respuesta.respondida ? 'window.avanzarSiguientePregunta()' : 'window.siguientePregunta()';
    
    html += `
            </div>
            ${feedbackHtml}
            <button class="boton-siguiente" id="btn-siguiente" onclick="${btnAction}" ${btnDisabled}>${btnText}</button>
        </div>
    `;
    
    container.innerHTML = html;
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    // Animación de entrada
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

// ============================================
// AVANZAR SIGUIENTE PREGUNTA
// ============================================
function avanzarSiguientePregunta() {
    const newIndex = preguntaActualIndex + 1;
    setPreguntaActualIndex(newIndex);
    
    if (preguntaActualIndex < preguntasActuales.length) {
        mostrarPregunta();
        actualizarProgreso();
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        examenGuardado = null;
        mostrarResumenFinal();
    }
}

function actualizarProgreso() {
    const progreso = document.getElementById('progreso-preguntas');
    const ley = leyesDisponibles.find(l => l.id === filtroLeyActual);
    const nombreLey = ley ? ley.nombre : '';
    
    if (progreso) {
        progreso.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>📝 <strong>${nombreLey}</strong></span>
                <button onclick="window.comenzarNuevoExamen()" style="background:#dc3545; border:none; color:white; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:bold;">❌ Cancelar</button>
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

// ============================================
// RESUMEN FINAL
// ============================================
function mostrarResumenFinal() {
    const container = document.getElementById('preguntas-container');
    const examenDiv = document.getElementById('preguntas-examen');
    
    if (examenDiv) examenDiv.style.display = 'block';
    
    const progreso = document.getElementById('progreso-preguntas');
    if (progreso) progreso.innerHTML = '';
    
    let aciertos = 0;
    let totalIntentos = 0;
    let aprendizajeCruzado = 0;
    
    let html = `
        <div class="pregunta-card" id="resumen-scroll" style="background-color: rgba(13, 110, 253, 0.1); border: 2px solid var(--azul); margin-top: 20px;">
            <h3>📋 RESUMEN DE LA ACTIVIDAD</h3>
            <hr style="border: 1px solid var(--borde); margin: 12px 0;">
    `;
    
    preguntasActuales.forEach((pregunta, idx) => {
        const respuesta = respuestasUsuario[idx];
        const acertada = respuesta.respondida;
        if (acertada) aciertos++;
        totalIntentos += respuesta.intentos;
        if (respuesta.intentos > 1) aprendizajeCruzado++;
        
        let icono = '';
        
        if (respuesta.respondida && respuesta.intentos === 1) {
            icono = '✅';
        } else if (respuesta.respondida && respuesta.intentos >= 2 && respuesta.intentos <= 3) {
            icono = '⚠️';
        } else {
            icono = '❌';
        }
        
        const iconoAprendizaje = respuesta.intentos > 1 ? ' 📚' : '';
        
        html += `
            <div style="padding: 8px 0; border-bottom: 1px solid var(--borde);">
                <p style="font-weight: bold;">${icono} Pregunta ${idx + 1}</p>
                <p style="font-size: 0.9rem; margin: 4px 0;">${pregunta.texto}</p>
                <p style="font-size: 0.9rem;">Respuesta: <strong>${respuesta.respuestaFinal || 'No respondida'}</strong></p>
                <p style="font-size: 1rem;">Intentos: ${respuesta.intentos}${iconoAprendizaje}</p>
            </div>
        `;
    });
    
    html += `
            <hr style="border: 1px solid var(--borde); margin: 12px 0;">
            <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;">
                <button class="boton-reiniciar" onclick="window.inicializarPreguntas('${filtroLeyActual}')">🔄 REPETIR EXAMEN</button>
                <button class="boton-reiniciar" onclick="window.volverAInicioPreguntas()">📋 CAMBIAR DE NORMA</button>            
            </div>
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
                if (window.scrollY > 300) {
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
    
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    examenGuardado = null;
    filtroLeyActual = '';
    
    mostrarInicioPreguntas();
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
export function hayExamenEnCurso() {
    return preguntasActuales.length > 0 && preguntaActualIndex < preguntasActuales.length;
}

export function iniciarExamenDesdeSelect() {
    const select = document.getElementById('filtro-ley-inicio');
    if (select && select.value) {
        inicializarPreguntas(select.value);
    }
}

// ============================================
// EXPOSICIÓN GLOBAL (para onclick en HTML)
// ============================================
window.iniciarExamenDesdeSelect = iniciarExamenDesdeSelect;
window.mostrarInicioPreguntas = mostrarInicioPreguntas;
window.verificarExamenGuardado = verificarExamenGuardado;
window.inicializarPreguntas = inicializarPreguntas;
window.continuarExamen = continuarExamen;
window.comenzarNuevoExamen = comenzarNuevoExamen;
window.guardarExamen = guardarExamen;
window.descartarExamen = descartarExamen;
window.preguntarGuardarExamen = preguntarGuardarExamen;
window.volverAInicioPreguntas = volverAInicioPreguntas;
window.seleccionarOpcion = seleccionarOpcion;
window.siguientePregunta = siguientePregunta;
window.avanzarSiguientePregunta = avanzarSiguientePregunta;