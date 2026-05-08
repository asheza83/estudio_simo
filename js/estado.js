// ============================================
// MÓDULO: estado.js
// Variables globales y preferencias
// ============================================

// Variables globales
export let leyesDisponibles = [];
export let leyActual = null;
export let preguntasBanco = [];
export let preguntasActuales = [];
export let preguntaActualIndex = 0;
export let respuestasUsuario = [];
export let modoOscuro = false;

// Tamaño de letra
export let tamañoLetraActual = 'font-normal';
export const tamañosLetra = ['font-small', 'font-normal', 'font-large', 'font-xlarge'];

// Variables del glosario
export let glosarioData = [];
export let glosarioFiltrado = [];
export let letraActual = 'TODAS';
export let paginaActual = 1;
export const TERMINOS_POR_PAGINA = 10;

// ============================================
// CONFIGURACIÓN CENTRALIZADA DE EVALUACIÓN
// ============================================

// Constante base
export const SEGUNDOS_POR_PREGUNTA = 60;

// Variables que cambian según el modo
export let variablesEvaluacion = {
    preguntas: 0,
    tiempoPorPregunta: null,
    tiempoTotal: null,
    feedback: false,
    intentos: 1
};

// Inicializar/resetear valores por defecto
export function inicializarEvaluacion() {
    variablesEvaluacion = {
        preguntas: 0,
        tiempoPorPregunta: null,
        tiempoTotal: null,
        feedback: false,
        intentos: 1
    };
    console.log(`🔄 Evaluación inicializada (valores por defecto)`);
}

// Configurar según el modo elegido
export function setModoEvaluacion(modo) {
    if (modo === 'estudio') {
        variablesEvaluacion = {
            preguntas: 5,
            tiempoPorPregunta: null,
            tiempoTotal: null,
            feedback: true,
            intentos: 4
        };
    } else if (modo === 'simulacro') {
        variablesEvaluacion = {
            preguntas: 100,
            tiempoPorPregunta: SEGUNDOS_POR_PREGUNTA,
            tiempoTotal: 100 * SEGUNDOS_POR_PREGUNTA,
            feedback: false,
            intentos: 1
        };
    }
    // 🔥 ACTUALIZAR TAMBIÉN LA REFERENCIA GLOBAL
    window.variablesEvaluacion = variablesEvaluacion;
    window.PREGUNTAS_POR_SESION = variablesEvaluacion.preguntas;
    console.log(`🎯 Modo ${modo} configurado:`, variablesEvaluacion);
}

// Ejecutar inicialización automática al cargar el módulo
inicializarEvaluacion();

// ============================================
// VARIABLES DEL SIMULACRO (legado, se migrará)
// ============================================
export let modoSimulacro = false;
export let tiempoRestante = 60;
export let temporizadorActivo = false;
export let puntajeSimulacro = 0;
export let tiempoPorPregunta = 60;

export function setModoSimulacro(value) { modoSimulacro = value; }
export function setTiempoRestante(value) { tiempoRestante = value; }
export function setTemporizadorActivo(value) { temporizadorActivo = value; }
export function setPuntajeSimulacro(value) { puntajeSimulacro = value; }
export function setTiempoPorPregunta(value) { tiempoPorPregunta = value; }

export let tiempoTotalRestante = 300;
export let tiempoTotalConfigurado = 300;

export function setTiempoTotalRestante(value) { tiempoTotalRestante = value; }
export function setTiempoTotalConfigurado(value) { tiempoTotalConfigurado = value; }

// Funciones para modificar variables globales (legado)
export function setLeyesDisponibles(data) { leyesDisponibles = data; }
export function setLeyActual(data) { leyActual = data; }
export function setPreguntasBanco(data) { preguntasBanco = data; }
export function setPreguntasActuales(data) { preguntasActuales = data; }
export function setPreguntaActualIndex(index) { preguntaActualIndex = index; }
export function setRespuestasUsuario(data) { respuestasUsuario = data; }
export function setModoOscuro(value) { modoOscuro = value; }
export function setTamañoLetraActual(value) { tamañoLetraActual = value; }
export function setGlosarioData(data) { glosarioData = data; }
export function setGlosarioFiltrado(data) { glosarioFiltrado = data; }
export function setLetraActual(value) { letraActual = value; }
export function setPaginaActual(value) { paginaActual = value; }

// Exposición global para window (legado)
setTimeout(() => {
    window.PREGUNTAS_POR_SESION = variablesEvaluacion.preguntas;
    window.preguntasActuales = preguntasActuales;
    window.variablesEvaluacion = variablesEvaluacion;
    window.setModoEvaluacion = setModoEvaluacion;
    window.inicializarEvaluacion = inicializarEvaluacion;
    console.log("🌐 Variables globales expuestas");
}, 100);