// ============================================
// INDEX - Punto de entrada del módulo preguntas
// ============================================

// Exportar funciones principales
export { inicializarPreguntas, comenzarNuevoExamen, continuarExamen } from './examen.js';
export { mostrarInicioPreguntas, verificarExamenGuardado } from './inicio.js';
export { preguntarGuardarExamen, guardarExamen, descartarExamen } from './guardado.js';
export { seleccionarOpcion, siguientePregunta } from './opciones.js';
export { avanzarSiguientePregunta } from './visual.js';
export { volverAInicioPreguntas } from './resumen.js';
export { hayExamenEnCurso, iniciarExamenDesdeSelect, diagnosticarRespuestas } from './helpers.js';
export { exportarResultadosPDF } from './pdf.js';

// Las funciones globales ya se exponen en cada módulo individual
// No es necesario repetirlas aquí