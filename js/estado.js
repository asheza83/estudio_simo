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

// Constantes
export const PREGUNTAS_POR_SESION = 5;

// Tamaño de letra
export let tamañoLetraActual = 'font-normal';
export const tamañosLetra = ['font-small', 'font-normal', 'font-large', 'font-xlarge'];

// Variables del glosario
export let glosarioData = [];
export let glosarioFiltrado = [];
export let letraActual = 'TODAS';
export let paginaActual = 1;
export const TERMINOS_POR_PAGINA = 10;

// Funciones para modificar variables globales
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

// ============================================
// VARIABLES DEL SIMULACRO (con temporizador)
// ============================================
export let modoSimulacro = false;        // false = Estudio, true = Simulacro
export let tiempoRestante = 60;          // segundos para pregunta actual
export let temporizadorActivo = false;   // si el temporizador está corriendo
export let puntajeSimulacro = 0;         // puntaje final sobre 100
export let tiempoPorPregunta = 60;       // segundos por pregunta (configurable)

// Funciones para modificar variables del simulacro
export function setModoSimulacro(value) { modoSimulacro = value; }
export function setTiempoRestante(value) { tiempoRestante = value; }
export function setTemporizadorActivo(value) { temporizadorActivo = value; }
export function setPuntajeSimulacro(value) { puntajeSimulacro = value; }
export function setTiempoPorPregunta(value) { tiempoPorPregunta = value; }