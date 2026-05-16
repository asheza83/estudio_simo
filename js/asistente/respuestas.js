// ============================================
// RESPUESTAS - Con detección de funcionalidades
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './embeddings.js';

// Verbos de acción que indican pregunta sobre funcionalidad
const VERBOS_ACCION = [
    'ordenar', 'organizar', 'clasificar', 'reordenar',
    'descargar', 'exportar', 'imprimir',
    'compartir', 'enviar', 'link', 'enlace',
    'guardar', 'almacenar', 'historial',
    'cambiar', 'modificar', 'ajustar', 'configurar', 'personalizar',
    'agregar', 'crear', 'editar', 'borrar', 'eliminar',
    'pausar', 'reanudar', 'detener',
    'generar', 'listar', 'filtrar',
    // NUEVOS verbos detectados
    'buscar',           // búsqueda en general
    'agrupar',          // agrupar resultados
    'programar',        // programar recordatorios
    'sincronizar',      // sincronizar dispositivos
    'recuperar',        // recuperar examen
    'desactivar',       // desactivar animaciones
    'ocultar',          // ocultar header
    'hablar',           // asistente por voz
    'recomendar',       // recomendaciones de estudio
    'notificar',        // notificaciones
    'recordar',         // recordatorios
    'suscribir',        // suscripciones
    'invitar',           // invitar amigos
    // NUEVOS (de la última prueba)
    'corregir',      // para corregir errores ortográficos
    'estudiar',      // para chat grupal
    'seguir',        // para seguir usuarios
    'entrenar',      // para entrenar al asistente
    'marcar',        // para marcar preguntas favoritas
    'practicar',     // para modo práctica
    'práctica',      // variante con acento
    'lotes',         // para preguntas por lotes
    'gamificar',     // para gamificación
    'puntuar',       // para puntos y niveles
    'competir',      // para competir con otros
    'correo'         // para envío de correos
];

// Excepciones: verbos de acción que SÍ corresponden a funcionalidades existentes
// Formato: "verbo:contexto específico"
// IMPORTANTE: Mientras más específico, mejor
const EXCEPCIONES = [
    // Búsquedas (solo lo que SÍ existe)
    'buscar:palabra en normas',
    'buscar:artículo en ley',
    'buscar:término en glosario',
    'buscar:en normas',
    'buscar:artículo',
    
    // Filtros (solo lo que SÍ existe)
    'filtrar:casos prácticos por competencia',
    'filtrar:casos por competencia',
    'filtrar:glosario por categoría',
    'filtrar:glosario por letra',
    'filtrar:competencias',
    
    // Exportación (solo lo que SÍ existe)
    'exportar:resultados a pdf en simulacro',
    'exportar:pdf en simulacro',
    'descargar:preguntas fallidas en pdf',
    'descargar:resultados en pdf',
    
    // Guardado (solo lo que SÍ existe)
    'guardar:progreso al cambiar pestaña',
    'guardar:progreso del examen',
    'guardar:preferencias en ajustes',
    'guardar:modo oscuro',
    'guardar:tamaño de letra',
    
    // Cambios (solo lo que SÍ existe)
    'cambiar:competencia después del examen',
    'cambiar:respuesta antes de verificar',
    'cambiar:tamaño de letra en ajustes',
    'cambiar:modo oscuro en ajustes',
    'cambiar:opción en modo estudio',
    
    // Compartir (solo lo que SÍ existe)
    'compartir:pdf de resultados',
    'compartir:archivo pdf',
    
    // Impresión (navegador - no es de la app pero el usuario pregunta)
    'imprimir:página con ctrl+p',
    'imprimir:página',
    'imprimir:con ctrl+p',
    'imprimir:pantalla con ctrl+p',
    'imprimir:pantalla'
];

function contieneVerboAccion(pregunta) {
    const preguntaLower = pregunta.toLowerCase();
    for (const verbo of VERBOS_ACCION) {
        if (preguntaLower.includes(verbo)) {
            return verbo;
        }
    }
    return null;
}

function esExcepcion(pregunta, verbo) {
    const preguntaLower = pregunta.toLowerCase();
    for (const excepcion of EXCEPCIONES) {
        // Verificar si la pregunta contiene la frase exacta de la excepción
        if (preguntaLower.includes(excepcion.toLowerCase())) {
            return true;
        }
        // También verificar por el formato "verbo:contexto"
        const [exVerbo, exContexto] = excepcion.split(':');
        if (verbo === exVerbo && exContexto && preguntaLower.includes(exContexto.toLowerCase())) {
            return true;
        }
    }
    return false;
}

function respuestaNoDisponible() {
    return "Lo siento, esa funcionalidad no está disponible en ESTUDIO SIMO. La herramienta está diseñada para ayudarte a prepararte para el concurso de la CNSC: estudiar la convocatoria, consultar las normas del sector salud, practicar con exámenes tipo SIMO (Modo Estudio y Modo Simulacro) y buscar términos en el Glosario. ¿Te ayudo con algún tema del concurso?";
}

export async function buscarRespuesta(pregunta) {
    // 1. Procesar opciones numéricas (ej. "1", "2", "sí", "no")
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false };
    
    // 2. Detectar si la pregunta contiene un verbo de acción
    const verbo = contieneVerboAccion(pregunta);
    
    if (verbo) {
        // 3. Verificar si es una excepción (funcionalidad que SÍ existe)
        if (esExcepcion(pregunta, verbo)) {
            // Es una funcionalidad existente → buscar en FAQ normal
            return await buscarRespuestaTFIDF(pregunta);
        } else {
            // Es un verbo de acción pero NO es excepción → funcionalidad no disponible
            console.log(`🔍 Detectada funcionalidad no disponible (verbo: ${verbo})`);
            return { respuesta: respuestaNoDisponible(), necesitaConfirmacion: false };
        }
    }
    
    // 4. Si no hay verbo de acción, buscar en FAQ normal
    return await buscarRespuestaTFIDF(pregunta);
}