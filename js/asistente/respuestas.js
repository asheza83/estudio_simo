// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { limpiarTexto } from './limpiador.js';
import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './tfidf.js';

// Variable global para el mensaje de bienvenida
let mensajeBienvenida = "¡Hola! Soy tu asistente virtual para resolver dudas sobre ESTUDIO SIMO. Puedes preguntarme sobre las pestañas, los modos de estudio, el glosario, las normas, los resultados, o cualquier duda sobre el concurso ESE 2. Estoy aquí para ayudarte en todo momento.";

export function setMensajeBienvenida(msg) {
    mensajeBienvenida = msg;
}

// Detectar preguntas ambiguas
function esAmbigua(pregunta) {
    const palabrasAmbiguas = ['esto', 'esta', 'este', 'esa', 'ese', 'eso', 'allí', 'ahí', 'allá'];
    const texto = pregunta.toLowerCase();
    
    // Palabras que indican que NO es ambigua (pregunta válida)
    const palabrasClave = ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'para qué', 'cuál', 'cuantos'];
    
    // Si tiene palabras clave, no es ambigua
    for (const clave of palabrasClave) {
        if (texto.includes(clave)) {
            return false;
        }
    }
    
    // Verificar palabras ambiguas
    for (const ambigua of palabrasAmbiguas) {
        if (texto.includes(ambigua)) {
            return true;
        }
    }
    
    return false;
}

export function buscarRespuesta(pregunta) {
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
    // 3. PREGUNTAS MUY CORTAS (saludos, ayuda)
    // ========================================
    const textoLower = texto.toLowerCase();
    
    if (textoLower === 'ayuda' || textoLower === 'help' || textoLower === 'menu') {
        return "📌 Puedo ayudarte con:\n\n1️⃣ ESTUDIO SIMO - Información de la herramienta\n2️⃣ Modo Estudio - Aprender sin presión\n3️⃣ Modo Simulacro - Entrenar velocidad\n4️⃣ Glosario - Buscar términos\n5️⃣ Normas del sector salud - Leyes y artículos\n6️⃣ Resultados y puntajes\n\nEscribe el número o hazme una pregunta específica.";
    }
    
    if (textoLower === 'hola' || textoLower === 'buenas' || textoLower === 'saludos') {
        return mensajeBienvenida;
    }
    
    // ========================================
    // 3.5 DETECTAR AMBIGÜEDAD (antes de TF-IDF)
    // ========================================
    if (esAmbigua(texto)) {
        return "¿Puedes ser más específico? No sé a qué te refieres con 'esto' o 'eso'. ¿Hablas de ESTUDIO SIMO, las preguntas, los resultados, las normas?";
    }
    
    // ========================================
    // 4. BUSCAR CON TF-IDF
    // ========================================
    const respuesta = buscarRespuestaTFIDF(texto);
    
    if (respuesta) {
        return respuesta;
    }
    
    // ========================================
    // 5. NO SE ENCONTRÓ RESPUESTA
    // ========================================
    return "No encontré una respuesta exacta. Puedes consultar las instrucciones (📖) o escribir 'ayuda' para ver el menú de opciones. ¿Cómo puedo ayudarte mejor?";
}