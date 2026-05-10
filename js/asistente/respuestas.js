// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { limpiarTexto } from './limpiador.js';
import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './embeddings.js';

// Variable global para el mensaje de bienvenida
let mensajeBienvenida = "¡Hola! Soy tu asistente virtual para resolver dudas sobre ESTUDIO SIMO. Puedes preguntarme sobre las pestañas, los modos de estudio, el glosario, las normas, los resultados, o cualquier duda sobre el concurso ESE 2. Estoy aquí para ayudarte en todo momento.";

export function setMensajeBienvenida(msg) {
    mensajeBienvenida = msg;
}

// Normalizar texto (minúsculas, sin acentos, sin puntuación)
function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[¿?¡!.,;:()]/g, '')
        .trim();
}

function esSoloSaludo(texto) {
    const textoNorm = normalizarTexto(texto);
    
    // Palabras que indican que el usuario está haciendo una pregunta real
    const palabrasPregunta = ['que', 'qué', 'cual', 'cuál', 'como', 'cómo', 
                              'donde', 'dónde', 'cuando', 'cuándo', 'quien', 'quién',
                              'que es', 'qué es', 'para que', 'para qué'];
    
    for (const palabra of palabrasPregunta) {
        if (textoNorm.includes(palabra)) {
            return false;
        }
    }
    
    const palabras = textoNorm.split(/\s+/);
    if (palabras.length > 4) return false;
    
    const saludos = ['hola', 'buenas', 'saludos', 'buenos dias', 'buenas tardes', 
                     'buenas noches', 'que tal', 'como estas', 'como va', 'como has estado',
                     'como te va', 'hey', 'heyy', 'ey', 'oye', 'epa', 'quiubo', 'que hubo', 
                     'que mas', 'parcero', 'parce', 'amigo', 'jefe', 'don', 'hello', 'hi'];
    
    for (const saludo of saludos) {
        if (textoNorm.includes(saludo)) {
            return true;
        }
    }
    return false;
}

function esAyuda(texto) {
    const textoNorm = normalizarTexto(texto);
    const ayudas = ['ayuda', 'help', 'menu'];
    for (const ayuda of ayudas) {
        if (textoNorm === ayuda) {
            return true;
        }
    }
    return false;
}

export async function buscarRespuesta(pregunta) {
    // ========================================
    // 1. CORRECTOR DE TIPOS COMUNES
    // ========================================
    let texto = limpiarTexto(pregunta);
    
    const correcciones = {
        'simulacr': 'simulacro',
        'pregntas': 'preguntas',
        'resultads': 'resultados',
        'estdio': 'estudio',
        'glosrio': 'glosario',
        'puntje': 'puntaje',
        'simulacroo': 'simulacro',
        'estudioo': 'estudio'
    };
    
    for (const [mal, bien] of Object.entries(correcciones)) {
        texto = texto.replace(new RegExp(mal, 'g'), bien);
    }
    
    // ========================================
    // 2. RESPUESTA NUMÉRICA (opciones 1-6)
    // ========================================
    const respuestaNumerica = procesarOpcionNumerica(texto);
    if (respuestaNumerica) return respuestaNumerica;
    
    // ========================================
    // 3. SALUDOS (solo si no hay pregunta)
    // ========================================
    if (esSoloSaludo(texto)) {
        return "👋 ¡Hola! ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre los modos de estudio, la convocatoria, el glosario, o cualquier duda sobre ESTUDIO SIMO.";
    }
    
    // ========================================
    // 4. AYUDA
    // ========================================
    if (esAyuda(texto)) {
        return "📌 Puedo ayudarte con:\n\n1️⃣ Modo Estudio - Aprender sin presión\n2️⃣ Modo Simulacro - Entrenar velocidad\n3️⃣ Glosario - Buscar términos\n4️⃣ Normas del sector salud - Leyes y artículos\n5️⃣ Resultados y puntajes\n\nEscribe el número o hazme una pregunta específica.";
    }
    
    // ========================================
    // 5. MiniLM (entiende por contexto semántico)
    // ========================================
    const respuesta = await buscarRespuestaTFIDF(texto);
    
    if (respuesta) {
        return respuesta;
    }
    
    // ========================================
    // 6. NO SE ENCONTRÓ RESPUESTA
    // ========================================
    return "No estoy seguro de haber entendido tu pregunta. Puedes escribir 'ayuda' para ver el menú de opciones o ser más específico. ¿Qué necesitas saber sobre ESTUDIO SIMO?";
}