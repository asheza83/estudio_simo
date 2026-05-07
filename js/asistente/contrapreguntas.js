// ============================================
// CONTRAPREGUNTAS - Generar respuestas para casos ambiguos
// ============================================

export function generarContrapregunta(texto) {
    // ========================================
    // 1. ERRORES / FALLAS (muy específico)
    // ========================================
    const fallaKeywords = ['no funciona', 'falla', 'error', 'problema', 'no sirve', 'no me sirve', 'no responde', 'se traba', 'se pega', 'lento', 'tarda', 'no carga'];
    for (const kw of fallaKeywords) {
        if (texto.includes(kw)) {
            return "🔍 Para ayudarte mejor, dime: ¿Qué estabas haciendo? ¿Qué parte de la aplicación? (pestañas, exámenes, glosario, ajustes). ¿Ves algún mensaje de error?";
        }
    }
    
    // ========================================
    // 2. PERDIDO / CONFUNDIDO
    // ========================================
    const perdidoKeywords = ['no sé', 'no entiendo', 'no comprendo', 'me perdí', 'perdido', 'confundido','no se que hacer', 'no se qué hacer',
    'estoy perdido', 'estoy confundido', 'no cacho', 'no pillo', 'estoy en la luna'];
    for (const kw of perdidoKeywords) {
        if (texto.includes(kw)) {
            return "📚 No te preocupes. Elige una opción:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario o búsqueda en leyes\n5️⃣ Recuperar pestañas\n6️⃣ Ajustes (modo oscuro, tamaño letra)";
        }
    }
    
    // ========================================
    // 3. AYUDA (incluye variantes)
    // ========================================
    const ayudaKeywords = ['ayuda', 'ayudame', 'ayudar', 'socorro', 'colabora', 'asistencia',
    'necesito ayuda', 'me puedes ayudar', 'necesito que me ayudes',
    'ayudes', 'ayudarme', 'ayudan', 'necesito ayuda por favor'];
    for (const kw of ayudaKeywords) {
        if (texto.includes(kw)) {
            return "🤖 Puedo ayudarte con:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario / búsqueda en leyes\n5️⃣ Recuperar pestañas ocultas\n6️⃣ Ajustes (modo oscuro, tamaño letra)\n\nResponde con el número que te interesa.";
        }
    }
    
    // ========================================
    // 4. RESPUESTAS VACÍAS O NEGATIVAS
    // ========================================
    const vacioKeywords = ['nada', 'ninguno', 'ninguna', 'no se', 'nope', 'no'];
    for (const kw of vacioKeywords) {
        if (texto.includes(kw) && texto.split(' ').length <= 2) {
            return "😅 Entiendo que a veces puede ser abrumador. ¿Por qué no empezamos con algo sencillo?\n\nEscribe **'ayuda'** para ver el menú de opciones, o pregúntame algo como:\n• ¿Qué es el modo estudio?\n• ¿Cómo recupero las pestañas?\n• ¿Cuándo son las inscripciones?";
        }
    }
    
    // ========================================
    // 5. INDETERMINADAS
    // ========================================
    const indeterminadoKeywords = ['eso', 'esto', 'aquello', 'ese', 'esa'];
    for (const kw of indeterminadoKeywords) {
        if (texto === kw || (texto.includes(kw) && texto.split(' ').length === 1)) {
            return "❓ No sé exactamente a qué te refieres con '" + kw + "'. ¿Puedes decirme qué parte de la aplicación o qué término te genera duda?\n\nPor ejemplo: 'puntaje', 'modo estudio', 'glosario', 'convocatoria', etc.";
        }
    }
    
    // ========================================
    // 6. SALUDOS (respuesta amigable)
    // ========================================
    const saludos = ['hola', 'buenas', 'saludos', 'hey', 'oye', 'epa', 'que tal',
    'como estas', 'como está', 'como va', 'buenos dias', 'buenas tardes',
    'como te va', 'que cuentas', 'quiubo', 'que hubo', 'como vamos',
    'como esta todo', 'que mas', 'bien o que'];
    for (const saludo of saludos) {
        if (texto.includes(saludo)) {
            return "👋 ¡Hola! ¿En qué puedo ayudarte?\n\nPuedes preguntarme sobre:\n• La convocatoria ESE 2\n• El modo estudio o simulacro\n• El glosario de términos\n• Los resultados y puntajes\n\nO escribe **'ayuda'** para ver el menú completo.";
        }
    }
    
    // ========================================
    // 7. RESPUESTA GENÉRICA FINAL
    // ========================================
    return "😓 Hola, no he logrado comprender tu inquietud. ¿Podrías darme más pistas o escribir algo más claro?\n\n📌 **Ejemplos de preguntas que sí entiendo:**\n• ¿Qué es el modo estudio?\n• ¿Cómo recupero las pestañas?\n• ¿Qué significa el ícono verde?\n• ¿Cuándo son las inscripciones?\n\nO escribe **'ayuda'** para ver el menú completo.";
}