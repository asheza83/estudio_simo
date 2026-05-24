// ============================================
// RESPUESTAS - Versión semántica sin listas de palabras
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF, buscarEnGlosarioSemantico, calcularSimilitud } from './embeddings.js';

// ============================================
// 1. DETECCIÓN DE FUNCIONALIDADES INEXISTENTES
// ============================================

const PROTOTIPO_FUNCIONALIDAD_INEXISTENTE = `
¿Cómo puedo ordenar los casos prácticos por fecha?
¿Se puede descargar el glosario completo en PDF?
¿Hay forma de compartir mis resultados en redes sociales?
¿Puedo imprimir todas las normas de una sola vez?
¿Cómo filtro los casos prácticos por dos categorías a la vez?
¿Existe un botón para guardar mis resultados en la nube?
¿Puedo cambiar el color de la barra de tiempo del simulacro?
`;

const UMBRAL_FUNCIONALIDAD_INEXISTENTE = 0.75;

async function esPreguntaDeFuncionalidadInexistente(pregunta) {
    const similitud = await calcularSimilitud(pregunta, PROTOTIPO_FUNCIONALIDAD_INEXISTENTE);
    console.log(`🔍 Similitud con funcionalidad inexistente: ${similitud.toFixed(3)}`);
    return similitud >= UMBRAL_FUNCIONALIDAD_INEXISTENTE;
}

function respuestaNoDisponible() {
    return "Lo siento, esa funcionalidad no está disponible en ESTUDIO SIMO. La herramienta está diseñada para ayudarte a prepararte para el concurso de la CNSC: estudiar la convocatoria, consultar las normas del sector salud, practicar con exámenes tipo SIMO (Modo Estudio y Modo Simulacro) y buscar términos en el Glosario. ¿Te ayudo con algún tema del concurso?";
}

// ============================================
// 2. EXTRACCIÓN DE TEMA (usando prototipos)
// ============================================

const TEMAS_PROTOTIPOS = {
    'pin': '¿Qué es el PIN? ¿Cómo se obtiene el PIN? ¿Cuánto cuesta el PIN? ¿Cómo recupero el PIN?',
    'antecedentes': '¿Dónde se consultan los antecedentes disciplinarios? ¿Qué son los antecedentes fiscales? ¿Dónde saco los antecedentes judiciales?',
    'normas': '¿Qué son las normas del sector salud? ¿Cómo busco en las leyes? ¿Qué dice la Ley 100?',
    'glosario': '¿Cómo se usa el glosario? ¿Cómo filtro términos en el glosario?',
    'modo estudio': '¿Qué es el modo estudio? ¿Cómo funciona el modo estudio?',
    'simulacro': '¿Qué es el simulacro? ¿Cómo funciona el modo simulacro?',
    'exportar': '¿Cómo exporto resultados a PDF? ¿Puedo guardar mis resultados?',
    'puntaje simo': '¿Cómo se calcula el puntaje SIMO? ¿Qué significa el puntaje?',
    'resultados': '¿Qué muestra la tabla de resultados? ¿Cómo veo mis aciertos?',
    'examen': '¿Cómo hago el examen? ¿Puedo repetir el examen? ¿Puedo cancelar el examen?',
    'preguntas': '¿Cómo selecciono las preguntas? ¿Qué tipos de preguntas hay?',
    'casos prácticos': '¿Qué son los casos prácticos? ¿Cómo filtro los casos?',
    'procedimientos': '¿Qué son los procedimientos de enfermería? ¿Dónde están los procedimientos?'
};

const UMBRAL_TEMA = 0.65;

async function extraerTemaDePregunta(pregunta) {
    if (!pregunta) return null;
    let mejorTema = null;
    let mejorSimilitud = 0;
    for (const [tema, prototipo] of Object.entries(TEMAS_PROTOTIPOS)) {
        const similitud = await calcularSimilitud(pregunta, prototipo);
        if (similitud > mejorSimilitud && similitud >= UMBRAL_TEMA) {
            mejorSimilitud = similitud;
            mejorTema = tema;
        }
    }
    return mejorTema;
}

// ============================================
// 3. BÚSQUEDA DE RESPUESTA (principal)
// ============================================

export async function buscarRespuesta(pregunta) {
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) {
        return { respuesta: respuestaNumerica, necesitaConfirmacion: false, tema: null };
    }

    // Detectar funcionalidades inexistentes
    if (await esPreguntaDeFuncionalidadInexistente(pregunta)) {
        console.log(`🔍 Detectada funcionalidad no disponible por similitud semántica`);
        return { respuesta: respuestaNoDisponible(), necesitaConfirmacion: false, tema: null };
    }

    // Buscar en glosario y FAQs en paralelo
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

    // Evaluar glosario
    if (respuestaGlosario && respuestaGlosario.respuesta) {
        mejorRespuesta = respuestaGlosario.respuesta;
        mejorSimilitud = respuestaGlosario.similitud;
        temaRespuestaDirecta = respuestaGlosario.termino || null;
    }

    // Evaluar FAQ
    if (resultadoFAQ) {
        const similitudFAQ = resultadoFAQ.similitud || 0;
        let textoFAQ = null;
        let temaFAQ = null;

        if (resultadoFAQ.respuesta && !resultadoFAQ.respuesta.includes("No estoy seguro")) {
            textoFAQ = resultadoFAQ.respuesta;
            temaFAQ = await extraerTemaDePregunta(resultadoFAQ.pregunta);
        } else if (resultadoFAQ.necesitaConfirmacion) {
            necesitaConfirmacion = true;
            temaConfirmacion = resultadoFAQ.tema;
            respuestaCorrectaConfirmacion = resultadoFAQ.respuestaCorrecta;
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

    // Manejo de zona gris (solo si el FAQ pide confirmación y no hay glosario)
    if (necesitaConfirmacion && mejorSimilitud === (resultadoFAQ?.similitud || 0) && !respuestaGlosario) {
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: temaConfirmacion,
            respuestaCorrecta: respuestaCorrectaConfirmacion
        };
    }

    // Respuesta encontrada
    if (mejorRespuesta) {
        return { respuesta: mejorRespuesta, necesitaConfirmacion: false, tema: temaRespuestaDirecta };
    }

    // Fallback
    return { respuesta: "No estoy seguro de haber entendido tu pregunta. ¿Podrías ser más específico?", necesitaConfirmacion: false, tema: null };
}