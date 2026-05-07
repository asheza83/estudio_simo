// ============================================
// AMBIGUO - Detectar si una pregunta es ambigua
// ============================================

export function esAmbigua(texto) {
    // ========================================
    // PALABRAS CLAVE QUE NUNCA SON AMBIGUAS
    // ========================================
    const palabrasClave = [
        // Preguntas con "qué", "cómo", "cuándo", etc.
        'qué es', 'que es', 'qué significa', 'que significa', 'cómo', 'como',
        'cuántas', 'cuantos', 'cuánto', 'cuanto', 'dónde', 'donde',
        'para qué', 'para que', 'qué pasa', 'que pasa', 'por qué', 'por que',
        'qué hago', 'que hago', 'qué tengo que hacer', 'para qué sirve',
        
        // Preguntas genéricas válidas
        'qué es esto', 'que es esto', 'qué significa esto', 'que significa esto',
        'cómo lo uso', 'como lo uso', 'qué hago aquí', 'que hago aqui',
        'eso qué significa', 'y eso', 'cuánto dura', 'cuanto dura',
        'dónde está', 'donde esta', 'qué es simo', 'que es simo',
        
        // Palabras sueltas pero importantes (siglas, términos clave)
        'cnsc', 'simo', 'opec', 'homeria', 'glosario', 'simulacro',
        'estudio', 'preguntas', 'resultados', 'puntaje', 'icono',
        'barra', 'progreso', 'colores', 'modo oscuro', 'ajustes',
        
        // NUEVAS: para preguntas sobre pestañas
        'hablame', 'pestañas', 'para que son', 'cuales son', 'que pestañas',
        'info pestañas', 'como funcionan las pestañas'
    ];
    
    // Si contiene alguna palabra clave, NO es ambigua
    for (const clave of palabrasClave) {
        if (texto.includes(clave)) {
            return false;
        }
    }
    
    // ========================================
    // VERDADERAS PREGUNTAS AMBIGUAS
    // ========================================
    const palabrasAmbiguas = [
        'no funciona', 'no sirve', 'falla', 'error', 'problema',
        'no sé', 'no entiendo', 'no puedo', 'no me deja', 'no carga',
        'se traba', 'se pega', 'lento', 'tarda', 'no responde',
        'ayuda', 'ayudame', 'me perdí', 'confundido'
    ];
    
    for (const ambigua of palabrasAmbiguas) {
        if (texto.includes(ambigua)) return true;
    }
    
    // ========================================
    // PALABRAS SUELTAS CORTAS (1-2 letras)
    // ========================================
    const palabras = texto.split(' ');
    if (palabras.length === 1 && palabras[0].length <= 2) {
        return true;  // "Hola", "Qué", "Eh", "Hey" → ambiguo
    }
    
    // ========================================
    // PREGUNTAS CORTAS (1-2 palabras)
    // ========================================
    if (palabras.length <= 2) {
        // Verificar si parece una pregunta válida
        const estructuraPregunta = ['que', 'como', 'para', 'donde', 'cuando', 'cual', 'hablame', 'info'];
        for (const word of estructuraPregunta) {
            if (texto.includes(word)) {
                return false;  // No es ambigua, parece una pregunta
            }
        }
        return true;
    }
    
    return false;
}