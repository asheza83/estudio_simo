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
    'imprimir:página con ctrl+p', 'imprimir:página', 'imprimir:con ctrl+p', 'imprimir:pantalla con ctrl+p', 'imprimir:pantalla',
    'imprimir:resultados',
    'descargar:app'
];

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

// Extraer tema de una pregunta del FAQ (versión mejorada)
function extraerTemaDePregunta(preguntaFAQ) {
    if (!preguntaFAQ) return null;
    let limpia = preguntaFAQ.toLowerCase()
        .replace(/^¿(qué es|que es|qué son|qué significa|qué es eso de|qué|cuál es|cuáles son|cómo funciona|cómo se usa|para qué sirve|dónde se|dónde puedo|puedo|me puedes|hablame de|dime sobre|cuéntame de|explícame|cómo|cómo sacar|cómo se calcula|cuál es la fórmula|qué significa|cuánto cuesta|cuánto vale|cuánto hay que pagar|qué precio tiene|cuál es el costo)/i, '')
        .replace(/[¿?¡!]/g, '')
        .trim();

    // Detectar normas específicas (ley, decreto, resolución) y devolver identificador completo
    const patronNorma = /\b(ley|decreto|resoluci[oó]n)\s+(\d{3,4})\b/i;
    const match = limpia.match(patronNorma);
    if (match) {
        return `${match[1]} ${match[2]}`.toLowerCase(); // ej. "ley 100", "decreto 1011"
    }
    
    const temasCanonicos = [
        'pin', 'antecedentes', 'normas', 'glosario', 'modo estudio', 'simulacro', 'exportar',
        'puntaje simo', 'resultados', 'examen', 'preguntas', 'casos prácticos', 'procedimientos'
    ];
    
    for (const tema of temasCanonicos) {
        if (limpia.includes(tema)) return tema;
    }
    
    const palabras = limpia.split(/\s+/);
    if (palabras.length > 3) return palabras.slice(0, 3).join(' ');
    return limpia;
}

function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[¿?¡!.,;:()]/g, '')
        .trim();
}

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

function eliminarRedundancia(textoBase, textoComplemento) {
    const normalizar = (str) => str.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const baseNorm = normalizar(textoBase);
    let complementoNorm = normalizar(textoComplemento);
    
    if (complementoNorm.startsWith(baseNorm)) {
        let corte = textoBase.length;
        while (corte < textoComplemento.length && ![' ', '.', ',', ';', '\n'].includes(textoComplemento[corte])) {
            corte++;
        }
        let resultado = textoComplemento.slice(corte).trim();
        if (resultado.length > 0) resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
        return resultado;
    }
    
    let maxMatch = 0;
    for (let i = Math.min(baseNorm.length, complementoNorm.length); i > 20; i--) {
        if (baseNorm.slice(0, i) === complementoNorm.slice(0, i)) {
            maxMatch = i;
            break;
        }
    }
    
    if (maxMatch > 20) {
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
        if (resultado.length > 0) resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
        return resultado;
    }
    return textoComplemento;
}

export async function buscarRespuesta(pregunta) {
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false, tema: null };
    
    const verbo = contieneVerboAccion(pregunta);
    if (verbo && !esExcepcion(pregunta, verbo)) {
        console.log(`🔍 Detectada funcionalidad no disponible (verbo: ${verbo})`);
        return { respuesta: respuestaNoDisponible(), necesitaConfirmacion: false, tema: null };
    }
    
    const [respuestaGlosario, resultadoFAQ] = await Promise.all([
        buscarEnGlosarioSemantico(pregunta),
        buscarRespuestaTFIDF(pregunta)
    ]);
    
    let mejorRespuesta = null;
    let mejorSimilitud = -1;
    let necesitaConfirmacion = false;
    let temaConfirmacion = null;
    let respuestaCorrectaConfirmacion = null;
    let temaRespuestaDirecta = null;
    
    if (respuestaGlosario && respuestaGlosario.respuesta) {
        mejorRespuesta = respuestaGlosario.respuesta;
        mejorSimilitud = respuestaGlosario.similitud;
        temaRespuestaDirecta = respuestaGlosario.termino || null;
    }
    
    if (resultadoFAQ) {
        let similitudFAQ = resultadoFAQ.similitud || 0;
        let textoFAQ = null;
        let temaFAQ = null;

        if (resultadoFAQ.respuesta && !resultadoFAQ.respuesta.includes("No estoy seguro")) {
            textoFAQ = resultadoFAQ.respuesta;
            temaFAQ = extraerTemaDePregunta(resultadoFAQ.pregunta);
        } else if (resultadoFAQ.necesitaConfirmacion) {
            necesitaConfirmacion = true;
            temaConfirmacion = resultadoFAQ.tema;
            respuestaCorrectaConfirmacion = resultadoFAQ.respuestaCorrecta;
            // *** CORRECCIÓN: actualizar mejorSimilitud ***
            if (similitudFAQ > mejorSimilitud) {
                mejorSimilitud = similitudFAQ;
            }
        }

        if (textoFAQ && similitudFAQ >= mejorSimilitud) {
            mejorRespuesta = textoFAQ;
            mejorSimilitud = similitudFAQ;
            necesitaConfirmacion = false;
            temaRespuestaDirecta = temaFAQ;
        }
    }
    
    if (necesitaConfirmacion && mejorSimilitud === (resultadoFAQ?.similitud || 0) && !respuestaGlosario) {
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: temaConfirmacion,
            respuestaCorrecta: respuestaCorrectaConfirmacion
        };
    }
    
    if (mejorRespuesta) {
        return { respuesta: mejorRespuesta, necesitaConfirmacion: false, tema: temaRespuestaDirecta };
    }
    
    return { respuesta: "No estoy seguro de haber entendido tu pregunta. ¿Podrías ser más específico?", necesitaConfirmacion: false, tema: null };
}