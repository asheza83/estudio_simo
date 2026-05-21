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
    const palabrasVacias = [
        'qué', 'que', 'es', 'son', 'está', 'esta', 'estan', 'definición', 'definicion',
        'significa', 'explica', 'explícame', 'decirme', 'podria', 'puedes', 'porfa', 'ayuda',
        'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'de', 'al', 'y', 'o',
        'eso', 'aquello', 'como', 'cual', 'cuando', 'donde', 'para', 'por', 'con', 'sin',
        'sobre', 'tras', 'durante', 'mediante', 'según'
    ];
    let palabras = pregunta.toLowerCase().split(/\s+/);
    palabras = palabras.filter(p => !palabrasVacias.includes(p) && p.length > 1);
    if (palabras.length === 0) return normalizarTexto(pregunta);
    return palabras.join(' ');
}

function buscarEnGlosario(preguntaOriginal, glosario) {
    if (!glosario || !glosario.terminos) return null;
    const preguntaNorm = normalizarTexto(preguntaOriginal);
    const candidato = extraerCandidato(preguntaNorm);
    
    let mejorMatch = null;
    let mejorPuntaje = 0;
    
    for (const item of glosario.terminos) {
        const terminoNorm = normalizarTexto(item.termino);
        
        if (preguntaNorm.includes(terminoNorm)) {
            if (terminoNorm.length > mejorPuntaje) {
                mejorPuntaje = terminoNorm.length;
                mejorMatch = item;
            }
            continue;
        }
        
        if (candidato.includes(terminoNorm) || terminoNorm.includes(candidato)) {
            if (terminoNorm.length > mejorPuntaje) {
                mejorPuntaje = terminoNorm.length;
                mejorMatch = item;
            }
            continue;
        }
        
        if (Math.abs(candidato.length - terminoNorm.length) <= 3) {
            const distancia = distanciaLevenshtein(candidato, terminoNorm);
            const maxLen = Math.max(candidato.length, terminoNorm.length);
            const umbral = Math.floor(maxLen * 0.3);
            if (distancia <= umbral) {
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

// ============================================================
// Función mejorada para eliminar redundancia entre glosario y FAQ
// ============================================================
function eliminarRedundancia(textoBase, textoComplemento) {
    // Normalizar ambos textos (minúsculas, eliminar puntuación, espacios extra)
    const normalizar = (str) => str.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const baseNorm = normalizar(textoBase);
    let complementoNorm = normalizar(textoComplemento);
    
    // Buscar si complementoNorm comienza con baseNorm (o una parte significativa)
    if (complementoNorm.startsWith(baseNorm)) {
        // Quitar la parte redundante del complemento original (respetando mayúsculas)
        let corte = textoBase.length;
        // Avanzar hasta el siguiente espacio o carácter no alfabético
        while (corte < textoComplemento.length && ![' ', '.', ',', ';', '\n'].includes(textoComplemento[corte])) {
            corte++;
        }
        let resultado = textoComplemento.slice(corte).trim();
        if (resultado.length > 0) {
            resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
        }
        return resultado;
    }
    
    // Si no hay coincidencia completa, buscar prefijo común más corto
    let maxMatch = 0;
    for (let i = Math.min(baseNorm.length, complementoNorm.length); i > 20; i--) {
        if (baseNorm.slice(0, i) === complementoNorm.slice(0, i)) {
            maxMatch = i;
            break;
        }
    }
    
    if (maxMatch > 20) {
        // Buscar en el texto original dónde termina esa coincidencia (aproximadamente)
        let corte = maxMatch;
        let indiceOriginal = 0;
        let caracteresNormalizados = 0;
        for (let j = 0; j < textoComplemento.length && caracteresNormalizados < maxMatch; j++) {
            const c = textoComplemento[j].toLowerCase();
            if (/[a-z0-9]/i.test(c)) {
                caracteresNormalizados++;
            }
            indiceOriginal = j;
        }
        corte = indiceOriginal + 1;
        while (corte < textoComplemento.length && ![' ', '.', ',', ';', '\n'].includes(textoComplemento[corte])) {
            corte++;
        }
        let resultado = textoComplemento.slice(corte).trim();
        if (resultado.length > 0) {
            resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
        }
        return resultado;
    }
    
    return textoComplemento;
}

export async function buscarRespuesta(pregunta) {
    // 1. Procesar opciones numéricas
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false };
    
    // 2. Detectar verbos de acción (funcionalidades)
    const verbo = contieneVerboAccion(pregunta);
    if (verbo && !esExcepcion(pregunta, verbo)) {
        console.log(`🔍 Detectada funcionalidad no disponible (verbo: ${verbo})`);
        return { respuesta: respuestaNoDisponible(), necesitaConfirmacion: false };
    }
    
        // 3. Consultar ambas fuentes en paralelo
    const [respuestaGlosario, resultadoFAQ] = await Promise.all([
        buscarEnGlosarioSemantico(pregunta),
        buscarRespuestaTFIDF(pregunta)
    ]);
    
    // Inicializar mejor respuesta
    let mejorRespuesta = null;
    let mejorSimilitud = -1;
    let necesitaConfirmacion = false;
    let temaConfirmacion = null;
    let respuestaCorrectaConfirmacion = null;
    
    // Evaluar glosario (si tiene objeto con respuesta y similitud)
    if (respuestaGlosario && respuestaGlosario.respuesta) {
        mejorRespuesta = respuestaGlosario.respuesta;
        mejorSimilitud = respuestaGlosario.similitud;
    }
    
    // Evaluar FAQ
    if (resultadoFAQ) {
        let similitudFAQ = resultadoFAQ.similitud || 0;
        let textoFAQ = null;
        
        if (resultadoFAQ.respuesta && !resultadoFAQ.respuesta.includes("No estoy seguro")) {
            textoFAQ = resultadoFAQ.respuesta;
        } else if (resultadoFAQ.necesitaConfirmacion) {
            // Zona gris: guardar datos para posible confirmación
            necesitaConfirmacion = true;
            temaConfirmacion = resultadoFAQ.tema;
            respuestaCorrectaConfirmacion = resultadoFAQ.respuestaCorrecta;
            textoFAQ = null; // no es respuesta directa
        }
        
        // Si la FAQ tiene respuesta directa y su similitud es mayor que la actual
        if (textoFAQ && similitudFAQ > mejorSimilitud) {
            mejorRespuesta = textoFAQ;
            mejorSimilitud = similitudFAQ;
            necesitaConfirmacion = false; // es respuesta directa, no zona gris
        }
    }
    
    // Si la mejor opción resulta ser de FAQ y está en zona gris (y no había glosario mejor)
    if (necesitaConfirmacion && mejorSimilitud === (resultadoFAQ?.similitud || 0) && !respuestaGlosario) {
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: temaConfirmacion,
            respuestaCorrecta: respuestaCorrectaConfirmacion
        };
    }
    
    // Si tenemos una respuesta directa (glosario o FAQ con alta confianza)
    if (mejorRespuesta) {
        return { respuesta: mejorRespuesta, necesitaConfirmacion: false };
    }
    
    // Si no hay ninguna respuesta
    return { respuesta: "No estoy seguro de haber entendido tu pregunta. ¿Podrías ser más específico?", necesitaConfirmacion: false };
}