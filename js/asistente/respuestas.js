// ============================================
// RESPUESTAS - Con detección de funcionalidades + Glosario + Coincidencia aproximada mejorada
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF, buscarEnGlosarioSemantico } from './embeddings.js';

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
    'buscar', 'agrupar', 'programar', 'sincronizar',
    'recuperar', 'desactivar', 'ocultar', 'hablar',
    'recomendar', 'notificar', 'recordar', 'suscribir', 'invitar',
    'corregir', 'estudiar', 'seguir', 'entrenar', 'marcar',
    'practicar', 'práctica', 'lotes', 'gamificar', 'puntuar', 'competir', 'correo',
    'descargo', 'pauso', 'agrupo', 'reinicio', 'programo', 'comparto', 'marco',
    'recomiendo', 'compito', 'notifico', 'sincronizo',"descargas", "pausas"
];

// Excepciones: verbos de acción que SÍ corresponden a funcionalidades existentes
const EXCEPCIONES = [
    'buscar:palabra en normas', 'buscar:artículo en ley', 'buscar:término en glosario',
    'buscar:en normas', 'buscar:artículo',
    'filtrar:casos prácticos por competencia', 'filtrar:casos por competencia',
    'filtrar:glosario por categoría', 'filtrar:glosario por letra', 'filtrar:competencias',
    'exportar:resultados a pdf en simulacro', 'exportar:pdf en simulacro',
    'descargar:preguntas fallidas en pdf', 'descargar:resultados en pdf',
    'guardar:progreso al cambiar pestaña', 'guardar:progreso del examen',
    'guardar:preferencias en ajustes', 'guardar:modo oscuro', 'guardar:tamaño de letra',
    'cambiar:competencia después del examen', 'cambiar:respuesta antes de verificar',
    'cambiar:tamaño de letra en ajustes', 'cambiar:modo oscuro en ajustes', 'cambiar:opción en modo estudio',
    'compartir:pdf de resultados', 'compartir:archivo pdf',
    'imprimir:página con ctrl+p', 'imprimir:página', 'imprimir:con ctrl+p', 'imprimir:pantalla con ctrl+p', 'imprimir:pantalla'
];

// ---------- Glosario ----------
let glosarioData = null;
let glosarioCargado = false;

async function cargarGlosario() {
    if (glosarioCargado) return glosarioData;
    try {
        const response = await fetch('datos/glosario.json');
        const data = await response.json();
        glosarioData = data;
        glosarioCargado = true;
        return glosarioData;
    } catch (error) {
        console.error('Error cargando glosario:', error);
        return null;
    }
}

function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[¿?¡!.,;:()]/g, '')
        .trim();
}

// Distancia de Levenshtein
function distanciaLevenshtein(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;
    const matriz = Array(lenB + 1).fill(null).map(() => Array(lenA + 1).fill(0));
    for (let i = 0; i <= lenA; i++) matriz[0][i] = i;
    for (let j = 0; j <= lenB; j++) matriz[j][0] = j;
    for (let j = 1; j <= lenB; j++) {
        for (let i = 1; i <= lenA; i++) {
            const costo = a[i-1] === b[j-1] ? 0 : 1;
            matriz[j][i] = Math.min(
                matriz[j][i-1] + 1,
                matriz[j-1][i] + 1,
                matriz[j-1][i-1] + costo
            );
        }
    }
    return matriz[lenB][lenA];
}

// Extraer la parte relevante de la pregunta (eliminar palabras comunes)
function extraerCandidato(pregunta) {
    // Palabras vacías que no forman parte del término
    const palabrasVacias = [
        'qué', 'que', 'es', 'son', 'está', 'esta', 'estan', 'definición', 'definicion',
        'significa', 'explica', 'explícame', 'decirme', 'podria', 'puedes', 'porfa', 'ayuda',
        'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'de', 'al', 'y', 'o',
        'eso', 'aquello', 'como', 'cual', 'cuando', 'donde', 'para', 'por', 'con', 'sin',
        'sobre', 'tras', 'durante', 'mediante', 'según'
    ];
    let palabras = pregunta.toLowerCase().split(/\s+/);
    palabras = palabras.filter(p => !palabrasVacias.includes(p) && p.length > 1);
    // Si después de filtrar no quedan palabras, devolvemos la pregunta original limpia
    if (palabras.length === 0) return normalizarTexto(pregunta);
    return palabras.join(' ');
}

function buscarEnGlosario(preguntaOriginal, glosario) {
    if (!glosario || !glosario.terminos) return null;
    const preguntaNorm = normalizarTexto(preguntaOriginal);
    const candidato = extraerCandidato(preguntaNorm);
    
    let mejorMatch = null;
    let mejorPuntaje = 0; // 0 = no encontrado, 1 = exacto, 2 = aproximado con baja distancia
    
    for (const item of glosario.terminos) {
        const terminoNorm = normalizarTexto(item.termino);
        
        // 1. Coincidencia exacta: el término aparece como subcadena en la pregunta
        if (preguntaNorm.includes(terminoNorm)) {
            // Priorizar términos más largos
            if (terminoNorm.length > mejorPuntaje) {
                mejorPuntaje = terminoNorm.length;
                mejorMatch = item;
            }
            continue;
        }
        
        // 2. Coincidencia exacta con el candidato extraído
        if (candidato.includes(terminoNorm) || terminoNorm.includes(candidato)) {
            if (terminoNorm.length > mejorPuntaje) {
                mejorPuntaje = terminoNorm.length;
                mejorMatch = item;
            }
            continue;
        }
        
        // 3. Coincidencia aproximada: distancia de Levenshtein entre el candidato y el término
        // Solo si la longitud del término es similar al candidato (diferencia <= 3)
        if (Math.abs(candidato.length - terminoNorm.length) <= 3) {
            const distancia = distanciaLevenshtein(candidato, terminoNorm);
            const maxLen = Math.max(candidato.length, terminoNorm.length);
            const umbral = Math.floor(maxLen * 0.3); // 30% de cambios
            if (distancia <= umbral) {
                // Asignar puntaje inverso a la distancia (menos distancia es mejor)
                const puntaje = 1000 - distancia;
                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    mejorMatch = item;
                }
            }
        }
    }
    return mejorMatch;
}

async function consultarGlosario(pregunta) {
    const glosario = await cargarGlosario();
    if (!glosario) return null;
    const resultado = buscarEnGlosario(pregunta, glosario);
    if (resultado) {
        return `📖 Según la definición contenida en el glosario, *${resultado.termino}* es: ${resultado.definicion}`;
    }
    return null;
}
// -----------------------------

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
        if (preguntaLower.includes(excepcion.toLowerCase())) {
            return true;
        }
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
    // 1. Procesar opciones numéricas
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false };
    
    // 2. Detectar verbos de acción (funcionalidades)
    const verbo = contieneVerboAccion(pregunta);
    if (verbo) {
        if (esExcepcion(pregunta, verbo)) {
            // Es excepción → continúa
        } else {
            console.log(`🔍 Detectada funcionalidad no disponible (verbo: ${verbo})`);
            return { respuesta: respuestaNoDisponible(), necesitaConfirmacion: false };
        }
    }
    
    // 3. NUEVO: Buscar primero en el glosario semántico (embeddings)
    const respuestaGlosarioSemantico = await buscarEnGlosarioSemantico(pregunta);
    if (respuestaGlosarioSemantico) {
        return { respuesta: `📖 Según la definición contenida en el glosario: ${respuestaGlosarioSemantico}`, necesitaConfirmacion: false };
    }
    
    // 4. Consultar glosario exacto (coincidencia de texto + Levenshtein)
    const respuestaGlosarioExacto = await consultarGlosario(pregunta);
    if (respuestaGlosarioExacto) {
        return { respuesta: respuestaGlosarioExacto, necesitaConfirmacion: false };
    }
    
    // 5. Si no se encontró en el glosario, buscar en FAQ normal
    return await buscarRespuestaTFIDF(pregunta);
}