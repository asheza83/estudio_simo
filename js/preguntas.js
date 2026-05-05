// ============================================
// MÓDULO: preguntas.js
// Sistema completo de preguntas (v7 - CON SELECTS ANIDADOS)
// ============================================

import { 
    preguntasBanco, preguntasActuales, preguntaActualIndex, respuestasUsuario,
    PREGUNTAS_POR_SESION,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario,
    modoSimulacro, setModoSimulacro, tiempoRestante, setTiempoRestante,
    temporizadorActivo, setTemporizadorActivo, tiempoPorPregunta,
    tiempoTotalRestante, setTiempoTotalRestante, tiempoTotalConfigurado, setTiempoTotalConfigurado
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
    
    if (inicio) inicio.style.display = 'block';   // ✅ Cambiado de 'none' a 'block'
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

        // Guardar el modo seleccionado (Estudio o Simulacro)
    const modoSeleccionado = window.modoSeleccionado || 'estudio';
    setModoSimulacro(modoSeleccionado === 'simulacro');

    // Configurar tiempo total si es modo simulacro
    if (modoSimulacro) {
        // Calcular tiempo total: 60 segundos por pregunta
        const tiempoTotal = PREGUNTAS_POR_SESION * 60;
        setTiempoTotalRestante(tiempoTotal);
        setTiempoTotalConfigurado(tiempoTotal);
        console.log(`⏱️ Simulacro: ${PREGUNTAS_POR_SESION} preguntas - Tiempo total: ${tiempoTotal / 60} minutos`);
    }
    
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
    // Limpiar temporizador
    setTemporizadorActivo(false);

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
    
    const opcionSeleccionada = respuesta.opcionesMostradas[indice];
    
    if (modoSimulacro) {
        // Simulacro: guardar respuesta inmediatamente
        respuesta.respondida = true;
        respuesta.respuestaFinal = opcionSeleccionada.texto;
        respuesta.intentos = 1;
        
        // Detener temporizador global
        if (intervaloGlobal) {
            clearInterval(intervaloGlobal);
            intervaloGlobal = null;
            setTemporizadorActivo(false);
        }
    } else {
        // Modo Estudio: solo seleccionar, sin guardar aún
        window.opcionSeleccionada = indice;
    }
    
    // Ocultar feedback
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    if (feedbackDiv) {
        feedbackDiv.style.display = 'none';
    }
    
    // Habilitar botón siguiente/verificar
    document.getElementById('btn-siguiente').disabled = false;
    document.getElementById('btn-siguiente').style.display = 'block';
    
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
    // Este flujo solo se usa en Modo Estudio
    if (modoSimulacro) return;
    
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
// ============================================
// MOSTRAR PREGUNTA (con tiempo total fijo)
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
    
    // ========================================
    // TEMPORIZADOR GLOBAL (solo simulacro y si no respondida)
    // ========================================
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
    
    // ========================================
    // HTML DE LA PREGUNTA
    // ========================================
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
    
    // Feedback: solo visible en Modo Estudio
    const feedbackHtml = (respuesta.respondida && !modoSimulacro) ? `
        <div id="feedback-${preguntaActualIndex}" class="feedback feedback-exito" style="display:block;">
            ✅ Correcto. ${respuesta.respuestaFinal}
        </div>
    ` : `<div id="feedback-${preguntaActualIndex}" class="feedback" style="display:none;"></div>`;
    
    // Botón: configuración según modo
    let btnText, btnAction, btnStyle;
    if (modoSimulacro) {
        // Simulacro: siempre "SIGUIENTE", sin verificación
        btnText = 'SIGUIENTE →';
        btnAction = 'window.avanzarSiguientePregunta()';
        btnStyle = '';
    } else {
        // Modo Estudio: flujo normal con verificación
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
    // INICIAR TEMPORIZADOR GLOBAL (solo simulacro y primera pregunta)
    // ========================================
    if (modoSimulacro && preguntaActualIndex === 0 && !intervaloGlobal && tiempoTotalRestante > 0) {
        iniciarTemporizadorGlobal();
    }
    
    // ========================================
    // SCROLL Y ANIMACIÓN FADE
    // ========================================
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
    // En simulacro, si no se seleccionó respuesta, marcar como incorrecta
    if (modoSimulacro) {
        const respuesta = respuestasUsuario[preguntaActualIndex];
        if (!respuesta.respondida) {
            respuesta.respondida = true;
            respuesta.respuestaFinal = "No respondida";
            respuesta.intentos = 1;
        }
    }
    
    const newIndex = preguntaActualIndex + 1;
    setPreguntaActualIndex(newIndex);
    
    if (preguntaActualIndex < preguntasActuales.length) {
        // Reiniciar temporizador solo en simulacro
        if (modoSimulacro && tiempoTotalRestante > 0 && !intervaloGlobal) {
            iniciarTemporizadorGlobal();
        }
        mostrarPregunta();
        actualizarProgreso();
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        // Detener temporizador al terminar (si estaba activo)
        if (intervaloGlobal) {
            clearInterval(intervaloGlobal);
            intervaloGlobal = null;
        }
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
// FUNCIONES DEL TEMPORIZADOR (SIMULACRO)
// ============================================

let intervaloActivo = null;

// ============================================
// TEMPORIZADOR GLOBAL (TIEMPO TOTAL)
// ============================================

let intervaloGlobal = null;

function iniciarTemporizadorGlobal() {
    if (!modoSimulacro) return;
    if (intervaloGlobal) clearInterval(intervaloGlobal);
    
    intervaloGlobal = setInterval(() => {
        if (!modoSimulacro) return;
        
        const tiempoActual = tiempoTotalRestante;
        if (tiempoActual <= 1) {
            // Tiempo total agotado
            clearInterval(intervaloGlobal);
            intervaloGlobal = null;
            setTemporizadorActivo(false);
            
            // Marcar todas las preguntas no respondidas como incorrectas
            for (let i = 0; i < preguntasActuales.length; i++) {
                const resp = respuestasUsuario[i];
                if (!resp.respondida) {
                    resp.respondida = true;
                    resp.respuestaFinal = 'Tiempo agotado';
                }
            }
            
            // Mostrar resumen final
            mostrarResumenFinal();
        } else {
            setTiempoTotalRestante(tiempoActual - 1);
            actualizarTemporizadorGlobalVisual();
        }
    }, 1000);
}

function detenerTemporizadorGlobal() {
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
    }
    setTemporizadorActivo(false);
}

function actualizarTemporizadorGlobalVisual() {
    const tiempoElement = document.getElementById('temporizador-simulacro');
    const barraElement = document.getElementById('barra-tiempo');
    if (!tiempoElement) return;
    
    const segundos = tiempoTotalRestante;
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    const tiempoTexto = `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    
    tiempoElement.textContent = tiempoTexto;
    
    const porcentaje = (segundos / tiempoTotalConfigurado) * 100;
    if (barraElement) {
        barraElement.style.width = `${porcentaje}%`;
        
        if (porcentaje < 20) {
            barraElement.style.backgroundColor = '#dc3545';
            tiempoElement.style.color = '#dc3545';
        } else if (porcentaje < 50) {
            barraElement.style.backgroundColor = '#ffc107';
            tiempoElement.style.color = '#ffc107';
        } else {
            barraElement.style.backgroundColor = '#0d6efd';
            tiempoElement.style.color = '#0d6efd';
        }
    }
}

// ============================================
// RESUMEN FINAL CON PUNTAJE SIMO (FASE 2 - CORREGIDO)
// ============================================
function mostrarResumenFinal() {
    // DETENER TEMPORIZADOR GLOBAL SI ESTÁ ACTIVO
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
        setTemporizadorActivo(false);
    }
    
    const container = document.getElementById('preguntas-container');
    const examenDiv = document.getElementById('preguntas-examen');
    
    if (examenDiv) examenDiv.style.display = 'block';
    
    const progreso = document.getElementById('progreso-preguntas');
    if (progreso) progreso.innerHTML = '';
    
    // ========================================
    // CÁLCULO DE ACIERTOS (basado en intentos)
    // ========================================
    let aciertos = 0;
    const totalPreguntas = preguntasActuales.length;
    
    for (let idx = 0; idx < totalPreguntas; idx++) {
        const respuesta = respuestasUsuario[idx];
        
        // 🔥 REGLA ÚNICA PARA AMBOS MODOS:
        // Si intentos === 1 → acertó a la primera → cuenta como acierto SIMO
        // Si intentos > 1 → falló → NO cuenta como acierto
        const esAcierto = (respuesta.intentos === 1);
        
        if (esAcierto) {
            aciertos++;
        }
        
        // Depuración (puedes eliminar después)
        console.log(`Pregunta ${idx + 1}: Intentos=${respuesta.intentos} → ${esAcierto ? '✅ ACIERTO' : '❌ NO ACIERTO'}`);
    }
    
    // Calcular puntaje SIMO (sobre 100)
    const puntajeFinal = Math.round((aciertos / totalPreguntas) * 100);
    const corteAprobatorio = 70;
    const aprobo = puntajeFinal >= corteAprobatorio;
    
    // ========================================
    // HTML DEL RESUMEN
    // ========================================
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
                <h3 style="margin: 0 0 10px 0;">📊 RESULTADO SIMO</h3>
                <div style="font-size: 2.5rem; font-weight: bold;">${puntajeFinal}/100</div>
                <div style="font-size: 1.1rem; margin: 5px 0;">✅ Aciertos (1er intento): ${aciertos} de ${totalPreguntas}</div>
                <div style="font-size: 1.1rem;">🎯 Corte de aprobación SIMO: ${corteAprobatorio}/100</div>
                <div style="font-size: 1.3rem; font-weight: bold; margin-top: 10px; color: ${aprobo ? 'var(--exito)' : 'var(--error)'};">
                    ${aprobo ? '🟢 RESULTADO: APROBÓ' : '🔴 RESULTADO: REPROBÓ'}
                </div>
                <div style="font-size: 0.9rem; margin-top: 8px;">
                    ${modoSimulacro ? '⏱️ Modo Simulacro - 60 segundos por pregunta' : '📚 Modo Estudio - Sin límite de tiempo'}
                </div>
                <div style="font-size: 0.8rem; margin-top: 8px; color: var(--texto-secundario);">
                    ℹ️ El puntaje SIMO se calcula como: (Aciertos al primer intento / Total preguntas) × 100
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
        
        // Buscar opción correcta (para mostrar)
        let textoCorrecto = '';
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            if (opcionCorrecta) {
                textoCorrecto = opcionCorrecta.texto;
            }
        }
        
        // Estado según intentos
        const esAcierto = (respuesta.intentos === 1);
        const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
        const textoIntentos = respuesta.intentos > 1 ? ` (${respuesta.intentos} intentos)` : '';
        
        // 🔥 LÓGICA DE ICONOS (máximo 4 opciones)
        let icono = '';
        let iconoTooltip = '';
        
        if (respuesta.respuestaFinal === 'Tiempo agotado') {
            icono = '⏰';
            iconoTooltip = 'Tiempo agotado';
        } else if (respuesta.intentos === 1) {
            icono = '✅';
            iconoTooltip = 'Correcta al primer intento';
        } else if (respuesta.intentos === 2 || respuesta.intentos === 3) {
            icono = '⚠️';
            iconoTooltip = `Aprendizaje (requirió ${respuesta.intentos} intentos)`;
        } else if (respuesta.intentos >= 4) {
            icono = '🔴';
            iconoTooltip = 'Requiere repaso (probó todas las opciones)';
        } else {
            icono = '❌';
            iconoTooltip = 'Incorrecta';
        }
        
        html += `
            <div style="padding: 8px 0; border-bottom: 1px solid var(--borde);">
                <p style="font-weight: bold; font-size: 1.2rem;">${icono} Pregunta ${idx + 1}</p>
                <p style="font-size: 1.1rem; margin: 4px 0;">${pregunta.texto}</p>
                <p style="font-size: 1.1rem;">Tu respuesta: <strong>${textoRespuesta}</strong>${textoIntentos}</p>`;
        
        // Mostrar respuesta correcta si no acertó al primer intento
        if (!esAcierto && textoCorrecto) {
            html += `<p style="font-size: 1rem; color: var(--exito);">Respuesta correcta: <strong>${textoCorrecto}</strong></p>`;
        }
        
        html += `</div>`;
    }
    
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
// DIAGNÓSTICO - Verificar estado de respuestas
// ============================================
window.diagnosticarRespuestas = function() {
    console.log('===== DIAGNÓSTICO DE RESPUESTAS =====');
    console.log('Total preguntas:', preguntasActuales.length);
    console.log('Respuestas guardadas:', respuestasUsuario);
    
    for (let idx = 0; idx < preguntasActuales.length; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        
        console.log(`\n--- Pregunta ${idx + 1} ---`);
        console.log('Texto:', pregunta.texto);
        console.log('Respuesta del usuario:', respuesta.respuestaFinal);
        console.log('Intentos:', respuesta.intentos);
        
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            console.log('Opción correcta:', opcionCorrecta ? opcionCorrecta.texto : 'NO ENCONTRADA');
            
            const esCorrecta = (respuesta.respuestaFinal === opcionCorrecta?.texto);
            console.log('¿Es correcta?', esCorrecta ? '✅ SI' : '❌ NO');
        } else {
            console.log('opcionesMostradas: NO EXISTE');
        }
    }
    console.log('===== FIN DIAGNÓSTICO =====');
};

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