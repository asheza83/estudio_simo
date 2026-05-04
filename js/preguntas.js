// ============================================
// MÓDULO: preguntas.js
// Sistema completo de preguntas (v7 - CON SELECTS ANIDADOS)
// ============================================

import { 
    preguntasBanco, preguntasActuales, preguntaActualIndex, respuestasUsuario,
    PREGUNTAS_POR_SESION,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario
} from './estado.js';
import { leyesDisponibles } from './estado.js';

let filtroLeyActual = '';
let examenGuardado = null;

// Configuración de subcategorías por tipo de competencia
const subcategoriasConfig = {
    funcionales: [
        { id: "ley100", nombre: "📄 Ley 100 de 1993" },
        { id: "ley1438", nombre: "📄 Ley 1438 de 2011" }
    ],
    basicas: [
        { id: "logicas", nombre: "🧠 Razonamiento lógico" },
        { id: "matematicas", nombre: "🔢 Matemáticas aplicadas" },
        { id: "lecturacritica", nombre: "📖 Lectura crítica" }  // ← Agregar
    ],
    comportamentales: [
        { id: "etica", nombre: "⚖️ Ética profesional" },
        { id: "trabajoequipo", nombre: "🤝 Trabajo en equipo" },        // ← Agregar
        { id: "orientacionservicio", nombre: "🎯 Orientación al servicio" }  // ← Agregar
    ]
};

// Mapa de rutas de archivos
const rutasArchivos = {
    // Funcionales
    ley100: "funcionales/ley100.json",
    ley1438: "funcionales/ley1438.json",
    // Básicas
    logicas: "basicas/logicas.json",
    matematicas: "basicas/matematicas.json",
    lecturacritica: "basicas/lectura-critica.json",
    // Comportamentales
    etica: "comportamentales/etica.json",
    orientacionservicio: "comportamentales/orientacion-servicio.json",
    trabajoequipo: "comportamentales/trabajo-equipo.json"
};

// ============================================
// FUNCIONES PARA OCULTAR/MOSTRAR CONTENIDO DESCRIPTIVO
// ============================================
function ocultarContenidoDescriptivo() {
    const descripcionPrueba = document.getElementById('descripcion-prueba');
    const infoTest = document.getElementById('info-test');
    if (descripcionPrueba) descripcionPrueba.style.display = 'none';
    if (infoTest) infoTest.style.display = 'none';
}

function restaurarContenidoDescriptivo() {
    const descripcionPrueba = document.getElementById('descripcion-prueba');
    const infoTest = document.getElementById('info-test');
    if (descripcionPrueba) descripcionPrueba.style.display = 'block';
    if (infoTest) infoTest.style.display = 'block';
}

// ============================================
// INICIALIZAR SELECTS ANIDADOS
// ============================================
export function inicializarSelectsCompetencias() {
    const tipoSelect = document.getElementById('tipo-competencia');
    const subcategoriaSelect = document.getElementById('subcategoria-competencia');
    const btnExamen = document.getElementById('btn-comenzar-examen');
    
    if (!tipoSelect || !subcategoriaSelect) return;
    
    tipoSelect.addEventListener('change', function() {
        const tipo = this.value;
        
        if (tipo && subcategoriasConfig[tipo]) {
            subcategoriaSelect.innerHTML = '<option value="">Selecciona una subcategoría...</option>';
            subcategoriasConfig[tipo].forEach(sub => {
                subcategoriaSelect.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
            });
            subcategoriaSelect.style.display = 'block';
            subcategoriaSelect.disabled = false;
            btnExamen.disabled = true;
        } else {
            subcategoriaSelect.style.display = 'none';
            subcategoriaSelect.disabled = true;
            btnExamen.disabled = true;
        }
    });
    
    subcategoriaSelect.addEventListener('change', function() {
        const btnExamen = document.getElementById('btn-comenzar-examen');
        btnExamen.disabled = (this.value === '');
        
        // 🔥 Scroll al botón COMENZAR EXAMEN cuando se habilita (en móvil)
        if (!btnExamen.disabled && window.innerWidth <= 768) {
            setTimeout(() => {
                btnExamen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });
}

// ============================================
// PANTALLA INICIAL
// ============================================
export function mostrarInicioPreguntas() {
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    
    if (inicio) inicio.style.display = 'block';
    if (examen) examen.style.display = 'none';
    
    filtroLeyActual = '';
    examenGuardado = null;
    
    // Inicializar selects anidados
    inicializarSelectsCompetencias();
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
// CARGAR PREGUNTAS DESDE ARCHIVO JSON
// ============================================
async function cargarPreguntasDesdeArchivo(archivoId) {
    const ruta = rutasArchivos[archivoId];
    if (!ruta) return null;
    
    try {
        const response = await fetch(`datos/preguntas/${ruta}`);
        const data = await response.json();
        return data.preguntas || [];
    } catch (error) {
        console.error(`Error cargando preguntas de ${archivoId}:`, error);
        return null;
    }
}

// ============================================
// INICIALIZAR EXAMEN
// ============================================
export async function inicializarPreguntas(archivoId = null) {
    if (!archivoId) {
        const subcategoriaSelect = document.getElementById('subcategoria-competencia');
        archivoId = subcategoriaSelect ? subcategoriaSelect.value : null;
    }
    
    if (!archivoId) return;
    
    filtroLeyActual = archivoId;
    examenGuardado = null;
    
    // Cargar preguntas desde el archivo correspondiente
    const preguntas = await cargarPreguntasDesdeArchivo(archivoId);
    
    if (!preguntas || preguntas.length === 0) {
        document.getElementById('preguntas-container').innerHTML = '<p>❌ No hay preguntas disponibles para esta subcategoría.</p>';
        return;
    }
    
    // Ocultar contenido descriptivo
    ocultarContenidoDescriptivo();
    
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    if (inicio) inicio.style.display = 'none';
    if (examen) examen.style.display = 'block';
    
    const preguntasMezcladas = [...preguntas].sort(() => Math.random() - 0.5);
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
    
    restaurarContenidoDescriptivo();
    mostrarInicioPreguntas();
}

export function continuarExamen() {
    if (!examenGuardado) {
        mostrarInicioPreguntas();
        return;
    }
    
    filtroLeyActual = examenGuardado.leyId;
    
    ocultarContenidoDescriptivo();
    
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
    
    restaurarContenidoDescriptivo();
    mostrarInicioPreguntas();
}

// ============================================
// SELECCIONAR OPCIÓN
// ============================================
export function seleccionarOpcion(indice) {
    const respuesta = respuestasUsuario[preguntaActualIndex];
    if (respuesta.respondida) return;
    
    // ✅ NUEVO: Ocultar el feedback cuando se selecciona una nueva opción
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    if (feedbackDiv) {
        feedbackDiv.style.display = 'none';
    }
    
    document.getElementById('btn-siguiente').disabled = false;
    document.getElementById('btn-siguiente').style.display = 'block';
    window.opcionSeleccionada = indice;
    
    setTimeout(() => {
        const btn = document.getElementById('btn-siguiente');
        if (btn && window.innerWidth <= 768) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 50);
}

// ============================================
// VERIFICAR RESPUESTA
// ============================================
export function siguientePregunta() {
    const respuesta = respuestasUsuario[preguntaActualIndex];
    
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
        
        // Scroll para que el botón sea visible en móvil después del feedback
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
        
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
        
        // Scroll para que el botón VERIFICAR (deshabilitado) sea visible en móvil
        setTimeout(() => {
            const btn = document.getElementById('btn-siguiente');
            if (btn && window.innerWidth <= 768) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    }
}

// ============================================
// GENERAR OPCIONES
// ============================================
function generarOpciones(pregunta) {
    const correcta = pregunta.respuestaCorrecta;
    const explicacionCorrecta = pregunta.explicacionCorrecta || pregunta.explicacion || "Respuesta correcta";
    const distractores = pregunta.distractores || [];
    
    const opciones = [
        { texto: correcta, esCorrecta: true, feedback: explicacionCorrecta }
    ];
    
    // Si los distractores son objetos (nuevo formato)
    if (distractores.length > 0 && typeof distractores[0] === 'object') {
        distractores.forEach(d => {
            opciones.push({
                texto: d.texto,
                esCorrecta: false,
                feedback: d.explicacion || `❌ Incorrecto. "${d.texto}" no es la respuesta correcta.`
            });
        });
    } else {
        // Formato antiguo (array de strings) - compatibilidad
        distractores.forEach(d => {
            opciones.push({
                texto: d,
                esCorrecta: false,
                feedback: `❌ Incorrecto. "${d}" no es la respuesta correcta.`
            });
        });
    }
    
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
    
    window.opcionSeleccionada = undefined;
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const respuesta = respuestasUsuario[preguntaActualIndex];
    
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
    
    const feedbackHtml = respuesta.respondida ? `
        <div id="feedback-${preguntaActualIndex}" class="feedback feedback-exito" style="display:block;">
            ✅ Correcto. ${respuesta.respuestaFinal}
        </div>
    ` : `<div id="feedback-${preguntaActualIndex}" class="feedback" style="display:none;"></div>`;
    
    const btnText = respuesta.respondida ? 'SIGUIENTE →' : 'VERIFICAR';
    const btnAction = respuesta.respondida ? 'window.avanzarSiguientePregunta()' : 'window.siguientePregunta()';
    const btnStyle = (!respuesta.respondida && window.opcionSeleccionada === undefined) ? 'style="display: none;"' : '';
    
    html += `
            </div>
            ${feedbackHtml}
            <button class="boton-siguiente" id="btn-siguiente" onclick="${btnAction}" ${btnStyle}>${btnText}</button>
        </div>
    `;
    
    container.innerHTML = html;
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
    
    if (progreso) {
        // Buscar el nombre en leyesDisponibles para funcionales
        let nombreMostrar = filtroLeyActual;
        const leyEncontrada = leyesDisponibles.find(l => l.id === filtroLeyActual);
        if (leyEncontrada) {
            nombreMostrar = leyEncontrada.nombre;
        } else {
            // Para competencias básicas y comportamentales, usar nombres legibles
            const nombresCompetencias = {
                // Básicas
                logicas: "Razonamiento lógico",
                lecturacritica: "Lectura Crítica",
                matematicas: "Matemáticas aplicadas",

                // Comportamentales
                etica: "Ética profesional",
                orientacionservicio: "Orientación al Servicio",
                trabajoequipo: "Trabajo en Equipo"
            };
            nombreMostrar = nombresCompetencias[filtroLeyActual] || filtroLeyActual;
        }
        
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
    
    let html = ``;

    html += `
        <hr style="border: 1px solid var(--borde); margin: 12px 0;">
        <p style="text-align: center; font-size: 1.2rem; color: var(--texto-secundario); margin-bottom: 12px; line-height: 1.4;">
            En esta sección encontrará una Tabla de Resumen de su actividad que contiene: Cada pregunta respondida, si fue correcta o incorrecta, la respuesta correcta y los intentos realizados.<br><br>
            💡 <strong>¿Qué hacer ahora?</strong><br>
            En la parte inferior encontrará dos botones:<br>
            • <strong>"REPETIR EXAMEN"</strong> - Carga nuevas preguntas de la misma competencia.<br>
            • <strong>"CAMBIAR DE COMPETENCIA"</strong> - Vuelve a los selectores de Tipo de Competencia y Subcategoría en la pestaña Preguntas.
        </p>
    </div>
    `;

    html += `<div class="pregunta-card" id="resumen-scroll" style="background-color: rgba(13, 110, 253, 0.1); border: 2px solid var(--azul); margin-top: 20px;">
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
                <p style="font-weight: bold; font-size: 1.2rem;">${icono} Pregunta ${idx + 1}</p>
                <p style="font-size: 1.1rem; margin: 4px 0;">${pregunta.texto}</p>
                <p style="font-size: 1.1rem;">Respuesta: <strong>${respuesta.respuestaFinal || 'No respondida'}</strong></p>
                <p style="font-size: 1.1rem; margin-top: 4px;">Intentos: ${respuesta.intentos}${iconoAprendizaje}</p>
            </div>
        `;

    });
    
    html += `
            <hr style="border: 1px solid var(--borde); margin: 12px 0;">
            <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;">
                <button class="boton-reiniciar" onclick="window.inicializarPreguntas('${filtroLeyActual}')">🔄 REPETIR EXAMEN</button>
                <button class="boton-reiniciar" onclick="window.comenzarNuevoExamen()">📋 CAMBIAR DE COMPETENCIA</button>            
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
    
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    examenGuardado = null;
    filtroLeyActual = '';
    
    restaurarContenidoDescriptivo();
    mostrarInicioPreguntas();
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
export function hayExamenEnCurso() {
    return preguntasActuales.length > 0 && preguntaActualIndex < preguntasActuales.length;
}

export function iniciarExamenDesdeSelect() {
    const subcategoriaSelect = document.getElementById('subcategoria-competencia');
    if (subcategoriaSelect && subcategoriaSelect.value) {
        inicializarPreguntas(subcategoriaSelect.value);
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