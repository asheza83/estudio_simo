// ============================================
// ASISTENTE IA - CHAT BÁSICO
// ============================================
export { initAsistente, toggleAsistente };

let conocimientoData = null;

// ============================================
// FUNCIÓN PARA LIMPIAR TEXTO (eliminar conectores)
// ============================================
function limpiarTexto(texto) {
    // Palabras vacías que SÍ se pueden eliminar
    const palabrasVacias = [
        'de', 'la', 'con', 'y', 'el', 'los', 'las', 'un', 'una',
        'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante',
        'en', 'entre', 'hacia', 'hasta', 'mediante', 'según', 'sin',
        'so', 'sobre', 'tras', 'vs', 'vía', 'mi', 'tu', 'su', 'nuestro',
        'me', 'te', 'al', 'del', 'puedo', 'puede', 'puedes', 'quiero',
        'saber', 'decir', 'hacer'
    ];
    
    // Palabras clave que NUNCA deben eliminarse
    const palabrasClave = [
        'que', 'qué', 'como', 'cómo', 'para', 'por', 'es', 'son', 'está', 'están',
        'ser', 'sido', 'se', 'lo', 'le', 'les', 'os', 'nos', 'cual', 'cuál',
        'donde', 'dónde', 'cuando', 'cuándo', 'quien', 'quién'
    ];
    
    let limpio = texto.toLowerCase()
        .replace(/[¿?¡!.,;:()]/g, '')
        .replace(/[áä]/g, 'a')
        .replace(/[éë]/g, 'e')
        .replace(/[íï]/g, 'i')
        .replace(/[óö]/g, 'o')
        .replace(/[úü]/g, 'u');
    
    const palabras = limpio.split(/\s+/);
    
    // Filtrar: eliminar solo palabras vacías que NO son clave
    const filtradas = palabras.filter(p => {
        // Conservar palabras clave aunque estén en palabrasVacias
        if (palabrasClave.includes(p)) return true;
        // Eliminar palabras vacías
        if (palabrasVacias.includes(p)) return false;
        // Conservar palabras con longitud > 1
        return p.length > 1;
    });
    
    return filtradas.join(' ');
}

// ============================================
// DETECCIÓN DE INTENCIÓN (ampliada)
// ============================================
function detectarIntencion(texto) {
    const intenciones = {
        // ========================================
        // PESTAÑAS (lo más específico primero)
        // ========================================
        PESTANA_ESPECIFICA: [
            'pestaña estudio simo', 'que es la pestaña estudio simo', 'para que sirve la pestaña estudio simo',
            'pestaña preguntas', 'que es la pestaña preguntas', 'para que sirve la pestaña preguntas',
            'pestaña glosario', 'que es la pestaña glosario', 'para que sirve la pestaña glosario'
        ],
        
        INFO_PESTANAS: [
            'que son las pestañas', 'hablame de las pestañas', 'para que son las pestañas',
            'cuantas pestañas hay', 'que pestañas tiene', 'cuales son las pestañas', 'info pestañas'
        ],
        
        // ========================================
        // PALABRAS SUELTAS
        // ========================================
        PALABRA_SUELTA: [
            'cnsc', 'simo', 'opec', 'glosario', 'simulacro', 'estudio', 
            'puntaje', 'resultado', 'resultados', 'homeria', 'ese 2'
        ],
        
        // ========================================
        // PREGUNTAS GENÉRICAS
        // ========================================
        PREGUNTA_GENERICA: [
            'que es esto', 'que significa esto', 'para que sirve', 'como lo usa',
            'que hago aqui', 'que tengo que hacer', 'y eso', 'eso que significa',
            'cuanto dura', 'donde esta lo de las preguntas', 'que es', 'que significa',
            'para que', 'como se usa', 'que hago', 'donde estan las preguntas',
            'que es esto que veo', 'que tengo que hacer aqui'
        ],
        
        // ========================================
        // RECUPERAR PESTAÑAS (SOLO para botón subir)
        // ========================================
        RECUPERAR_PESTANAS: [
            'ocult', 'desapare', 'perd', 'escond', 'se fueron', 'no veo las',
            'volver a mostrar', 'recuperar', 'subir', 'botón subir', 'flecha',
            'cómo las recupero', 'las tres cositas', 'se volvieron locas', 'huyeron'
        ],
        
        // ========================================
        // RESTO DE INTENCIONES (sin cambios)
        // ========================================
        INTRO_APP: [
            'qué es estudio simo', 'que es estudio simo', 'estudio simo que es',
            'qué es esta aplicación', 'para qué sirve esto'
        ],
        
        ESTRUCTURA_APP: [
            'cuántas pestañas', 'que pestañas hay', 'qué pestañas tiene',
            'cómo está organizado', 'organización de la app'
        ],
        
        CNSC_SIMO: [
            'qué es la cnsc', 'que es la cnsc', 'cnsc que es',
            'qué significa simo', 'que significa simo', 'simo significado',
            'qué es simo', 'que es simo'
        ],
        
        QUE_EVALUA_SIMO: [
            'qué evalúa simo', 'que evalua simo', 'evalúa simo',
            'competencias que evalúa', 'pruebas simo'
        ],
        
        GLOSARIO: [
            'glosario', 'término', 'sigla', 'definición', 'qué significa',
            'buscar palabra', 'filtro', 'categoría', 'paginación',
            'diccionario', 'qué es glosario', 'que es el glosario',
            'cuántos términos', 'como busco en glosario', 'filtros glosario'
        ],
        
        MODO_ESTUDIO: [
            'modo estudio', 'estudiar sin presión', 'feedback inmediato',
            'qué es modo estudio', 'que es el modo estudio',
            'cuántos intentos', 'icono', 'chulito', 'triangulito', 'circulo rojo'
        ],
        
        MODO_SIMULACRO: [
            'simulacro', 'temporizador', 'qué es simulacro', 'que es el simulacro',
            'cuánto tiempo', 'barra de progreso', 'colores barra',
            'cómo se calcula el puntaje', 'corte para aprobar', '70%'
        ],
        
        BUSCAR_LEYES: [
            'buscar en leyes', 'buscador universal', 'normas', 'artículo',
            'encontrar artículo', 'buscar palabra en ley', 'eps', 'afiliación',
            'cómo busco una palabra', 'buscar en las normas', 'buscador de leyes',
            'dónde está el buscador', 'como busco un articulo', 'ley 100'
        ],
        
        AJUSTES: [
            'ajustes', 'modo oscuro', 'tamaño de letra', 'letra más grande',
            'letra más pequeña', 'configuración', 'engranaje', 'luna',
            'para qué sirve el botón de ajustes', 'cómo activo modo oscuro',
            'cómo cambio el tamaño de la letra'
        ],
        
        CONVOCATORIA: [
            'convocatoria', 'inscripciones', 'vacantes', 'fechas', 'requisitos',
            'cómo me inscribo', 'cómo aplico', 'ESE 2', 'CNSC', 'SIMO',
            'concurso de méritos', 'cómo participar', 'cuándo empieza',
            'cuánto cuesta inscribirse', 'derechos de participación',
            'PIN', 'pago', 'etapas del concurso', 'listado de elegibles',
            'cuándo son las inscripciones', 'cuantas vacantes tiene'
        ],
        
        RESULTADOS: [
            'puntaje', 'cálculo', 'aprob', 'reprob', 'corte de aprobación',
            'fondo verde', 'fondo rojo', 'icono', 'chulito', 'triangulito',
            'círculo rojo', 'qué significa', 'resultados', 'nota', 'calificación'
        ],
        
        CASOS_PRACTICOS: [
            'casos prácticos', 'casos', 'dilemas éticos', 'situaciones reales',
            'qué son los casos prácticos', 'filtros tienen los casos'
        ],
        
        GUARDAR_PROGRESO: [
            'guardar progreso', 'se guarda', 'continuar después', 'pierdo el progreso',
            'qué pasa si cambio de pestaña'
        ],
        
        CANCELAR_EXAMEN: [
            'cancelar examen', 'botón cancelar', 'cancelar la prueba', 'borrar progreso'
        ],
        
        PERIODO_PRUEBA: [
            'período de prueba', 'periodo de prueba', 'prueba de 6 meses',
            'qué es el período de prueba'
        ],
        
        DIFERENCIA_SIMO_MAESTRO: [
            'diferencia entre simo y sistema maestro', 'sistema maestro',
            'simo vs maestro', 'carrera docente'
        ],
        
        QUE_ES_OPEC: [
            'qué es la opec', 'que es opec', 'opec significado'
        ],
        
        BOTON_INSTRUCCIONES: [
            'botón instrucciones', 'libro instrucciones', 'modal de bienvenida',
            'instrucciones de uso'
        ]
    };
    
    for (const [intencion, palabras] of Object.entries(intenciones)) {
        for (const palabra of palabras) {
            if (texto.includes(palabra)) {
                return intencion;
            }
        }
    }
    return 'GENERICA';
}

// ============================================
// PROCESAR OPCIONES NUMÉRICAS DEL USUARIO
// ============================================
function procesarOpcionNumerica(texto) {
    // Primero, validar que sea EXACTAMENTE un número del 1 al 6
    // sin palabras adicionales
    const numerosValidos = ['1', '2', '3', '4', '5', '6'];
    
    // Si el texto es exactamente un número válido
    if (numerosValidos.includes(texto)) {
        const numero = parseInt(texto);
        
        switch(numero) {
            case 1:
                return "📚 Te explico las pestañas:\n\n• **Estudio SIMO**: Información de convocatoria, normas y casos prácticos.\n• **Preguntas**: Exámenes de práctica con Modo Estudio y Modo Simulacro.\n• **Glosario**: Más de 140 términos clave.\n\n¿Quieres saber más sobre alguna pestaña en específico?";
            case 2:
                return "📚 El **Modo Estudio** es ideal para aprender:\n\n• Sin límite de tiempo\n• Puedes intentar hasta 4 veces por pregunta\n• Feedback inmediato con explicaciones\n• Al final, muestra la respuesta correcta\n\n¿Necesitas más detalles?";
            case 3:
                return "⏱️ El **Modo Simulacro** replica el examen real:\n\n• 5 minutos para 5 preguntas (tiempo total fijo)\n• Sin feedback durante el examen\n• Solo el primer intento cuenta para el puntaje\n• Puntaje = (aciertos ÷ 5) × 100\n• Corte de aprobación: 70/100\n\n¿Necesitas más detalles?";
            case 4:
                return "🔍 Para buscar:\n\n**En el Glosario:**\n• Escribe una palabra (mínimo 3 letras) y presiona Enter\n• Las coincidencias se resaltan en amarillo\n\n**En las Leyes:**\n• Ve a Estudio SIMO > Normas del sector salud\n• Escribe una palabra (ej: EPS) y presiona Enter\n• Haz clic en cualquier resultado para ver el artículo completo";
            case 5:
                return "⬆️ Para recuperar las pestañas ocultas:\n\n1️⃣ Mira en la esquina inferior derecha de la pantalla\n2️⃣ Busca el botón azul con una flecha ↑ que dice 'Subir'\n3️⃣ Haz clic en él\n\nLas pestañas volverán a aparecer y subirás al inicio.";
            case 6:
                return "⚙️ Para cambiar la configuración:\n\n1️⃣ Haz clic en el botón ⚙️ Ajustes (arriba a la derecha)\n2️⃣ Se abrirá una ventana con:\n\n• 🌙 **Modo oscuro**: Actívalo para estudiar de noche\n• 🔤 **Tamaño de letra**: Usa A- (disminuir) y A+ (aumentar)\n\nHay 4 tamaños: pequeña, normal, grande y extra grande.";
            default:
                return null;
        }
    }
    
    // Si no es un número exacto del 1 al 6, retornar null
    return null;
}

// ============================================
// GENERAR CONTRAPREGUNTAS (solo para casos realmente ambiguos)
// ============================================
function generarContrapregunta(texto) {
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
    const perdidoKeywords = ['no sé', 'no entiendo', 'no comprendo', 'me perdí', 'perdido', 'confundido', 'no se que hacer', 'no se qué hacer'];
    for (const kw of perdidoKeywords) {
        if (texto.includes(kw)) {
            return "📚 No te preocupes. Elige una opción:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario o búsqueda en leyes\n5️⃣ Recuperar pestañas\n6️⃣ Ajustes (modo oscuro, tamaño letra)";
        }
    }
    
    // ========================================
    // 3. AYUDA (incluye variantes)
    // ========================================
    const ayudaKeywords = ['ayuda', 'ayudame', 'ayudar', 'socorro', 'colabora', 'asistencia', 'necesito ayuda', 'me puedes ayudar', 'necesito que me ayudes'];
    for (const kw of ayudaKeywords) {
        if (texto.includes(kw)) {
            return "🤖 Puedo ayudarte con:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario / búsqueda en leyes\n5️⃣ Recuperar pestañas ocultas\n6️⃣ Ajustes (modo oscuro, tamaño letra)\n\nResponde con el número que te interesa.";
        }
    }
    
    // ========================================
    // 4. RESPUESTAS VACÍAS O NEGATIVAS (NUEVO)
    // ========================================
    const vacioKeywords = ['nada', 'ninguno', 'ninguna', 'no se', 'nope', 'no'];
    for (const kw of vacioKeywords) {
        if (texto.includes(kw) && texto.split(' ').length <= 2) {
            return "😅 Entiendo que a veces puede ser abrumador. ¿Por qué no empezamos con algo sencillo?\n\nEscribe **'ayuda'** para ver el menú de opciones, o pregúntame algo como:\n• ¿Qué es el modo estudio?\n• ¿Cómo recupero las pestañas?\n• ¿Cuándo son las inscripciones?";
        }
    }
    
    // ========================================
    // 5. INDETERMINADAS (mejorado)
    // ========================================
    const indeterminadoKeywords = ['eso', 'esto', 'aquello', 'ese', 'esa'];
    for (const kw of indeterminadoKeywords) {
        // Solo si es exactamente la palabra o una palabra suelta
        if (texto === kw || (texto.includes(kw) && texto.split(' ').length === 1)) {
            return "❓ No sé exactamente a qué te refieres con '" + kw + "'. ¿Puedes decirme qué parte de la aplicación o qué término te genera duda?\n\nPor ejemplo: 'puntaje', 'modo estudio', 'glosario', 'convocatoria', etc.";
        }
    }
    
    // ========================================
    // 6. SALUDOS (respuesta amigable)
    // ========================================
    const saludos = ['hola', 'buenas', 'saludos', 'hey', 'oye', 'epa', 'que tal', 'como estas', 'buenos dias', 'buenas tardes'];
    for (const saludo of saludos) {
        if (texto.includes(saludo)) {
            return "👋 ¡Hola! ¿En qué puedo ayudarte?\n\nPuedes preguntarme sobre:\n• La convocatoria ESE 2\n• El modo estudio o simulacro\n• El glosario de términos\n• Los resultados y puntajes\n\nO escribe **'ayuda'** para ver el menú completo.";
        }
    }
    
    // ========================================
    // 7. RESPUESTA GENÉRICA FINAL (para TODO lo demás)
    // ========================================
    return "😓 Hola, no he logrado comprender tu inquietud. ¿Podrías darme más pistas o escribir algo más claro?\n\n📌 **Ejemplos de preguntas que sí entiendo:**\n• ¿Qué es el modo estudio?\n• ¿Cómo recupero las pestañas?\n• ¿Qué significa el ícono verde?\n• ¿Cuándo son las inscripciones?\n\nO escribe **'ayuda'** para ver el menú completo.";
}

// ============================================
// DETECTAR SI LA PREGUNTA ES AMBIGUA (más estricto)
// ============================================
function esAmbigua(texto) {
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

// ============================================
// CARGAR CONOCIMIENTO DESDE JSON
// ============================================
async function cargarConocimiento() {
    try {
        const response = await fetch('datos/ia-conocimiento.json');
        conocimientoData = await response.json();
        console.log('✅ Asistente IA: conocimiento cargado');
    } catch (error) {
        console.error('❌ Error cargando conocimiento:', error);
    }
}

// ============================================
// BUSCAR RESPUESTA (función principal)
// ============================================
function buscarRespuesta(pregunta) {
    if (!conocimientoData) return "Lo siento, aún no estoy listo. Intenta más tarde.";
    
    const texto = limpiarTexto(pregunta);
    
    // ========================================
    // RESPUESTAS DIRECTAS (MÁXIMA PRIORIDAD)
    // ========================================
    
    // ¿Cómo lo uso? - detecta cualquier variante
    if ((texto.includes('como') || texto.includes('cómo')) && 
        (texto.includes('usar') || texto.includes('uso') || texto.includes('utilizar'))) {
        return "📚 Para usar ESTUDIO SIMO:\n\n1️⃣ Explora las 3 pestañas en la parte superior\n2️⃣ En **Preguntas**, selecciona el modo (Estudio o Simulacro)\n3️⃣ Elige competencia y subcategoría\n4️⃣ Haz clic en COMENZAR EXAMEN\n5️⃣ Si tienes dudas, escribe 'ayuda' para ver el menú\n\n¿Quieres que te explique alguna parte en detalle?";
    }
    
    // ¿Dónde está lo de las preguntas? - detecta cualquier variante
    if ((texto.includes('donde') || texto.includes('dónde')) && 
        (texto.includes('pregunta') || texto.includes('preguntas') || texto.includes('examen'))) {
        return "📝 La pestaña **Preguntas** es donde realizas los exámenes. Está en la parte superior, junto a 'Estudio SIMO' y 'Glosario'. Allí puedes seleccionar el modo (Estudio o Simulacro), elegir competencia y comenzar el examen.";
    }
            
    // CNSC
    if (texto.includes('cnsc') && conocimientoData.concursoSIMO?.cnsc) {
        return conocimientoData.concursoSIMO.cnsc.definicion;
    }
    
    // SIMO (excluyendo "estudio simo" para no confundir)
    if (texto.includes('simo') && !texto.includes('estudio simo') && conocimientoData.concursoSIMO?.simo) {
        return conocimientoData.concursoSIMO.simo.definicion;
    }
    
    // OPEC
    if (texto.includes('opec')) {
        return "📋 **OPEC**: Oferta Pública de Empleo de Carrera. Es la vacante publicada en SIMO que representa un empleo público disponible en una entidad del Estado. Cada OPEC tiene requisitos específicos y un número de vacantes. ¿Te ayudo a entender cómo postularte?";
    }
    
    // Glosario (definición, no cómo usarlo)
    if (texto.includes('glosario') && conocimientoData.pestanas?.glosario) {
        return "📖 El **Glosario** es una de las 3 pestañas principales. Contiene más de 140 términos clave del SGSSS y salud mental, organizados en 5 categorías: siglas, entidades, términos, principios y carrera. Puedes buscar por palabra, filtrar por categoría o por letra inicial.";
    }
    
    // Simulacro (definición, no FAQ de error)
    if (texto.includes('simulacro') && conocimientoData.pestanas?.preguntas?.modos) {
        const modoSimulacro = conocimientoData.pestanas.preguntas.modos.find(m => m.nombre.includes('Simulacro'));
        if (modoSimulacro) {
            return `⏱️ **${modoSimulacro.nombre}**: ${modoSimulacro.descripcion}\n\n📌 **Características:**\n${modoSimulacro.caracteristicas.map(c => `• ${c}`).join('\n')}`;
        }
    }
    
    // Estudio (definición)
    if (texto.includes('estudio') && conocimientoData.pestanas?.preguntas?.modos) {
        const modoEstudio = conocimientoData.pestanas.preguntas.modos.find(m => m.nombre.includes('Estudio'));
        if (modoEstudio) {
            return `📚 **${modoEstudio.nombre}**: ${modoEstudio.descripcion}\n\n📌 **Características:**\n${modoEstudio.caracteristicas.map(c => `• ${c}`).join('\n')}`;
        }
    }
    
    // Puntaje / Resultados
    if ((texto.includes('puntaje') || texto.includes('puntajes')) && conocimientoData.resultados) {
        return `📊 ${conocimientoData.resultados.explicacion}\n\n📌 **Ejemplo:** ${conocimientoData.resultados.ejemplo}`;
    }
    
    if ((texto.includes('resultado') || texto.includes('resultados')) && conocimientoData.resultados) {
        return `📊 ${conocimientoData.resultados.explicacion}\n\n📌 **Ejemplo:** ${conocimientoData.resultados.ejemplo}\n\n📌 **Iconos en Modo Estudio:**\n• ✅ Acertó al primer intento\n• ⚠️ Acertó después de varios intentos\n• 🔴 Probó todas las opciones (requiere repaso)\n• ⏰ Tiempo agotado`;
    }
    
    // ========================================
    // 2. BUSCAR EN FAQ DEL JSON (CON PRECAUCIÓN)
    // ========================================
    if (conocimientoData.faqGeneral) {
        // Palabras que NO deben activar FAQ (porque ya tienen respuesta propia)
        const palabrasEvitar = ['simo', 'glosario', 'simulacro', 'estudio', 'resultado', 'resultados', 'puntaje', 'puntajes'];
        
        for (const faq of conocimientoData.faqGeneral) {
            const preguntaLimpia = faq.pregunta.toLowerCase().replace(/[¿?]/g, '');
            
            // Verificar si es una palabra evitada
            let esPalabraEvitada = false;
            for (const ev of palabrasEvitar) {
                if (texto === ev || (texto.split(' ').length === 1 && texto.includes(ev))) {
                    esPalabraEvitada = true;
                    break;
                }
            }
            
            if (!esPalabraEvitada && (texto.includes(preguntaLimpia) || preguntaLimpia.includes(texto))) {
                return faq.respuesta;
            }
        }
    }
    
    // ========================================
    // 3. RESPUESTA GENERAL DE PESTAÑAS
    // ========================================
    if ((texto.includes('pestaña') || texto.includes('pestañas')) && conocimientoData.estructuraApp) {
        return `📌 La aplicación tiene ${conocimientoData.estructuraApp.pestanas.length} pestañas:\n\n` +
               conocimientoData.estructuraApp.pestanas.map(p => 
                   `${p.icono} **${p.nombre}**: ${p.descripcion}`
               ).join('\n\n');
    }
    
    // ========================================
    // 4. VERIFICAR SI ES RESPUESTA NUMÉRICA
    // ========================================
    const respuestaNumerica = procesarOpcionNumerica(texto);
    if (respuestaNumerica) return respuestaNumerica;
    
    // ========================================
    // 5. DETECTAR INTENCIÓN Y AMBIGÜEDAD
    // ========================================
    let intencion = detectarIntencion(texto);
    
    if (intencion === 'GENERICA') {
        if (esAmbigua(texto)) {
            const contrapregunta = generarContrapregunta(texto);
            if (contrapregunta) return contrapregunta;
        }
    }
    
    // ========================================
    // 6. RESPUESTAS SEGÚN INTENCIÓN (RESPALDO)
    // ========================================
    switch(intencion) {
        case 'INFO_PESTANAS':
            return "📌 La aplicación tiene **3 pestañas principales**:\n\n" +
                   "📚 **Estudio SIMO**: Información de convocatoria, normas del sector salud y casos prácticos.\n" +
                   "📝 **Preguntas**: Exámenes con Modo Estudio (aprender) y Modo Simulacro (entrenar velocidad).\n" +
                   "📖 **Glosario**: Más de 140 términos clave con buscador y filtros.\n\n" +
                   "¿Quieres más detalles sobre alguna pestaña en específico?";
        
        case 'PESTANA_ESPECIFICA':
            if (texto.includes('estudio simo')) {
                return "📚 La **pestaña Estudio SIMO** contiene información teórica: convocatoria ESE 2, normas del sector salud (Ley 100, Ley 1438) y casos prácticos. Tiene un selector con 4 opciones: Inicio, Convocatoria, Normas y Casos prácticos.";
            }
            if (texto.includes('preguntas')) {
                return "📝 La **pestaña Preguntas** es el corazón de la herramienta. Aquí evalúas tus conocimientos con 2 modos: 📚 Modo Estudio (aprender sin presión) y ⏱️ Modo Simulacro (entrenar velocidad). Puedes seleccionar entre 6 competencias diferentes.";
            }
            if (texto.includes('glosario')) {
                return "📖 La **pestaña Glosario** contiene más de 140 términos clave del SGSSS y salud mental. Puedes buscar por palabra, filtrar por categoría (siglas, entidades, términos, principios, carrera) o por letra inicial (A-Z).";
            }
            return "Las 3 pestañas principales son: Estudio SIMO (información teórica), Preguntas (exámenes) y Glosario (términos clave). ¿De cuál quieres más información?";
        
        case 'PREGUNTA_GENERICA':
            // NUEVO: para "¿Cómo lo uso?"
            if (texto.includes('como lo uso') || texto.includes('cómo lo uso')) {
                return "📚 Para usar ESTUDIO SIMO:\n\n1️⃣ Explora las 3 pestañas en la parte superior\n2️⃣ En **Preguntas**, selecciona el modo (Estudio o Simulacro)\n3️⃣ Elige competencia y subcategoría\n4️⃣ Haz clic en COMENZAR EXAMEN\n5️⃣ Si tienes dudas, escribe 'ayuda' para ver el menú\n\n¿Quieres que te explique alguna parte en detalle?";
            }
            
            // NUEVO: para "¿Dónde está lo de las preguntas?"
            if (texto.includes('donde esta lo de las preguntas') || texto.includes('dónde está lo de las preguntas')) {
                return "📝 La pestaña **Preguntas** es donde realizas los exámenes. Está en la parte superior, junto a 'Estudio SIMO' y 'Glosario'. Allí puedes seleccionar el modo (Estudio o Simulacro), elegir competencia y comenzar el examen.";
            }
            if (texto.includes('como lo uso') || texto.includes('cómo lo uso')) {
                return "📚 Para usar ESTUDIO SIMO:\n\n1️⃣ Explora las 3 pestañas en la parte superior\n2️⃣ En **Preguntas**, selecciona el modo (Estudio o Simulacro)\n3️⃣ Elige competencia y subcategoría\n4️⃣ Haz clic en COMENZAR EXAMEN\n5️⃣ Si tienes dudas, escribe 'ayuda' para ver el menú\n\n¿Quieres que te explique alguna parte en detalle?";
            }
            if (texto.includes('donde esta lo de las preguntas') || texto.includes('dónde está lo de las preguntas')) {
                return "📝 La pestaña **Preguntas** es donde realizas los exámenes. Está en la parte superior, junto a 'Estudio SIMO' y 'Glosario'. Allí puedes seleccionar el modo (Estudio o Simulacro), elegir competencia y comenzar el examen.";
            }
            if (texto.includes('que es esto') || texto.includes('qué es esto')) {
                return conocimientoData.introduccion?.descripcion || "📚 Esta es ESTUDIO SIMO, una herramienta de preparación para auxiliares de enfermería que buscan ingresar al Hospital Mental de Risaralda (HOMERIS) mediante el concurso ESE 2 de la CNSC.\n\nTiene 3 pestañas: Estudio SIMO (información), Preguntas (exámenes) y Glosario (términos). ¿Te ayudo con alguna en específico?";
            }
            if (texto.includes('para que sirve') || texto.includes('para qué sirve')) {
                return "📚 ESTUDIO SIMO sirve para prepararte para el concurso de méritos ESE 2. Puedes:\n\n• Informarte sobre la convocatoria\n• Practicar con preguntas (Modo Estudio o Simulacro)\n• Consultar términos en el Glosario\n\n¿Qué te gustaría hacer?";
            }
            if (texto.includes('cuanto dura') || texto.includes('cuánto dura')) {
                return "⏱️ ¿A qué te refieres? Si hablas del simulacro, dura 5 minutos para 5 preguntas. Si te refieres a otra cosa, por favor se más específico.";
            }
            if (texto.includes('que hago aqui') || texto.includes('qué hago aquí') || texto.includes('que tengo que hacer')) {
                return "📚 Aquí puedes prepararte para el concurso ESE 2. Te sugiero:\n\n1️⃣ Ve a la pestaña **Estudio SIMO** para informarte sobre la convocatoria y normas.\n2️⃣ Ve a la pestaña **Preguntas** para practicar con exámenes.\n3️⃣ Usa el **Glosario** para buscar términos que no entiendas.\n\n¿Por cuál quieres empezar?";
            }
            return "🤔 No entendí bien tu pregunta. Puedes:\n\n• Escribir **'ayuda'** para ver el menú de opciones\n• Preguntar algo más específico como '¿qué es el modo estudio?'\n• Consultar las instrucciones con el botón 📖\n\n¿Cómo puedo ayudarte mejor?";
        
        // ========================================
        // RESTO DE CASES (se mantienen igual)
        // ========================================
        case 'INTRO_APP':
            return "📚 ESTUDIO SIMO es una herramienta gratuita de preparación para auxiliares de enfermería que buscan ingresar al Hospital Mental de Risaralda (HOMERIS) mediante el concurso de méritos ESE 2 de la CNSC. Tiene 3 pestañas: Estudio SIMO, Preguntas y Glosario.";
        
        case 'ESTRUCTURA_APP':
            return "📌 La aplicación tiene 3 pestañas:\n\n📚 **Estudio SIMO**: Convocatoria ESE 2, normas del sector salud (Ley 100, Ley 1438) y casos prácticos.\n📝 **Preguntas**: Modo Estudio y Modo Simulacro para evaluar tus conocimientos.\n📖 **Glosario**: Más de 140 términos clave con buscador y filtros.";
        
        case 'CNSC_SIMO':
            return "📋 **CNSC**: Comisión Nacional del Servicio Civil, órgano autónomo que administra los concursos de méritos.\n\n**SIMO**: Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad, plataforma tecnológica de la CNSC para concursos de méritos en empleos públicos de carrera administrativa.";
        
        case 'QUE_EVALUA_SIMO':
            return "📋 SIMO evalúa 6 competencias para auxiliares de enfermería:\n\n• 🧠 Razonamiento lógico\n• 🔢 Razonamiento matemático\n• 📖 Comprensión lectora\n• ⚖️ Ética profesional\n• 🤝 Trabajo en equipo\n• 🎯 Orientación al servicio";
        
        case 'RECUPERAR_PESTANAS':
            return "⬆️ Cuando te desplaces hacia abajo, las pestañas se ocultan. Usa el botón ↑ Subir (esquina inferior derecha) para recuperarlas. Si cambias de pestaña durante un examen, el sistema guarda tu progreso automáticamente.";
        
        case 'GLOSARIO':
            return "📖 El glosario tiene más de 140 términos. Para buscar, escribe una palabra (mínimo 3 letras) y presiona Enter. Las coincidencias se resaltan en amarillo. También puedes filtrar por categoría (siglas, entidades, términos, principios, carrera).";
        
        case 'MODO_ESTUDIO':
            if (texto.includes('icono') || texto.includes('chulito') || texto.includes('triangulito') || texto.includes('círculo')) {
                return "📊 Los iconos en Modo Estudio significan:\n\n✅ **Chulito verde**: Acertaste al primer intento\n⚠️ **Triángulo amarillo**: Acertaste después de varios intentos (aprendizaje)\n🔴 **Círculo rojo**: Probaste todas las opciones (requiere repaso)\n⏰ **Reloj**: Tiempo agotado";
            }
            return "📚 Modo Estudio: Sin límite de tiempo, feedback inmediato, puedes intentar hasta 4 veces por pregunta. Ideal para aprender.";
        
        case 'MODO_SIMULACRO':
            if (texto.includes('barra') || texto.includes('color')) {
                return "📊 La barra de tiempo del simulacro cambia de color según el tiempo restante:\n\n🟢 **Verde**: más del 50% tiempo\n🟡 **Amarillo**: entre 20% y 50%\n🔴 **Rojo**: menos del 20%\n\nLos últimos 5 segundos parpadean en rojo.";
            }
            if (texto.includes('puntaje') || texto.includes('cálculo') || texto.includes('corte')) {
                return "📊 Puntaje = (Aciertos al primer intento ÷ Total preguntas) × 100. Corte de aprobación: 70/100. Ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ.";
            }
            return "⏱️ Modo Simulacro: 5 minutos fijos para 5 preguntas, sin feedback durante el examen. Solo el primer intento cuenta. Puntaje = (aciertos ÷ 5) × 100. Corte de aprobación: 70/100.";
        
        case 'BUSCAR_LEYES':
            if (texto.includes('ley 100') || texto.includes('artículo')) {
                return "🔍 Para buscar un artículo en la Ley 100: Ve a Estudio SIMO > Normas del sector salud. Selecciona 'Ley 100 de 1993'. Usa el buscador dentro de la ley o haz clic en los artículos relevantes listados.";
            }
            if (texto.includes('dónde') || texto.includes('ubicado')) {
                return "🔍 El buscador de leyes está en: Estudio SIMO > Normas del sector salud. Allí encontrarás un buscador universal. Escribe una palabra (ej: EPS, afiliación) y presiona Enter.";
            }
            return "🔍 Para buscar en leyes: Ve a Estudio SIMO > Normas del sector salud. Escribe una palabra (ej: EPS, artículo 157) y presiona Enter. Haz clic en cualquier resultado para ver el artículo completo.";
        
        case 'AJUSTES':
            return "⚙️ Botón Ajustes (arriba a la derecha):\n\n🌙 **Modo oscuro**: Actívalo para estudiar de noche\n🔤 **Tamaño de letra**: 4 tamaños (pequeña, normal, grande, extra grande) con botones A- y A+";
        
        case 'CONVOCATORIA':
            if (texto.includes('vacantes') || texto.includes('cuántas')) {
                return "📋 Convocatoria ESE 2: 2.477 vacantes en 72 ESE del país. Modalidades: ascenso general (184), ascenso discapacidad (3), abierto general (2.293), abierto discapacidad (194).";
            }
            if (texto.includes('inscribirme') || texto.includes('cómo')) {
                return "📋 Para inscribirte: 1) Crear perfil en SIMO, 2) Buscar la vacante, 3) Pagar el PIN (aproximadamente $43.350 nivel técnico/asistencial), 4) Formalizar la aspiración.";
            }
            return "📋 Convocatoria ESE 2: Inscripciones en julio-agosto 2026. 2.477 vacantes en 72 ESE. Modalidades: ascenso general (184), ascenso discapacidad (3), abierto general (2.293), abierto discapacidad (194).";
        
        case 'RESULTADOS':
            if (texto.includes('fondo verde')) {
                return "📊 El fondo verde en los resultados significa que la respuesta fue correcta al primer intento. En Modo Estudio, el fondo verde aparece en la tabla de resultados cuando acertaste.";
            }
            if (texto.includes('fondo rojo')) {
                return "📊 El fondo rojo en los resultados significa que la respuesta fue incorrecta o que el tiempo se agotó. En Modo Estudio, se muestra la respuesta correcta debajo.";
            }
            return "📊 Puntaje = (Aciertos al primer intento ÷ Total preguntas) × 100. Corte de aprobación: 70/100. Ejemplo: 4 aciertos de 5 = 80/100 → APROBÓ.";
        
        case 'CASOS_PRACTICOS':
            if (texto.includes('filtros')) {
                return "🩺 Los casos prácticos tienen filtros por competencia: TODAS, Básicas (lógica, matemáticas, lectura crítica), Funcionales (normas), Comportamentales (ética, trabajo en equipo, orientación al servicio). Paginación: 10 casos por página.";
            }
            return "🩺 Los casos prácticos son situaciones reales que podrías enfrentar en HOMERIS. Clasificados por competencia (básicas, funcionales, comportamentales) con respuestas orientativas desplegables. Tienen paginación de 10 casos por página.";
        
        case 'GUARDAR_PROGRESO':
            return "💾 Si cambias de pestaña durante un examen, el sistema guarda automáticamente tu avance (pregunta actual, respuestas seleccionadas, intentos). Al volver, puedes continuar donde lo dejaste.";
        
        case 'CANCELAR_EXAMEN':
            return "❌ El botón Cancelar examen (rojo) borra todo el progreso de la prueba actual y vuelve a la pantalla de selección de competencias.";
        
        case 'PERIODO_PRUEBA':
            return "📋 El período de prueba es de seis meses después del nombramiento. Durante este tiempo, la entidad evalúa tu desempeño real en el puesto. Solo después de superarlo, eres considerado empleado de carrera con todos los derechos de estabilidad.";
        
        case 'DIFERENCIA_SIMO_MAESTRO':
            return "📋 **SIMO**: CNSC - concursos de carrera administrativa, requiere pago de PIN, genera derechos de carrera.\n\n**Sistema Maestro**: Ministerio de Educación - solo para docentes, gratuito, nombramiento provisional, no genera derechos de carrera.";
        
        case 'QUE_ES_OPEC':
            return "📋 OPEC (Oferta Pública de Empleo de Carrera) es la vacante publicada en SIMO para concursos de méritos. Representa un empleo público disponible en una entidad del Estado.";
        
        case 'BOTON_INSTRUCCIONES':
            return "📖 El botón Instrucciones (📖) abre el modal de bienvenida, donde se explica el funcionamiento de la aplicación. También aparece automáticamente la primera vez que ingresas.";
        
        case 'PALABRA_SUELTA':
            if (texto.includes('cnsc')) {
                return "📋 **CNSC**: Comisión Nacional del Servicio Civil. Es el órgano autónomo que administra los concursos de méritos para empleos públicos de carrera administrativa en Colombia. ¿Quieres saber más sobre su función o sobre la convocatoria ESE 2?";
            }
            if (texto.includes('simo')) {
                return "📋 **SIMO**: Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad. Es la plataforma tecnológica de la CNSC para concursos de méritos. A través de SIMO puedes buscar vacantes, inscribirte y consultar resultados. ¿Necesitas ayuda con algo específico?";
            }
            if (texto.includes('opec')) {
                return "📋 **OPEC**: Oferta Pública de Empleo de Carrera. Es la vacante publicada en SIMO que representa un empleo público disponible en una entidad del Estado. Cada OPEC tiene requisitos específicos y un número de vacantes. ¿Te ayudo a entender cómo postularte?";
            }
            if (texto.includes('glosario')) {
                return "📖 El **Glosario** es una de las 3 pestañas principales. Contiene más de 140 términos clave del SGSSS y salud mental, organizados en 5 categorías. Puedes buscar por palabra, filtrar por categoría o por letra inicial. ¿Quieres saber cómo usar el buscador?";
            }
            if (texto.includes('simulacros')) {
                return "⏱️ El **Modo Simulacro** está en la pestaña Preguntas. Simula las condiciones reales del examen: 5 minutos para 5 preguntas, sin feedback durante la prueba, y al final obtienes un puntaje SIMO sobre 100. El corte de aprobación es 70/100. ¿Quieres más detalles?";
            }
            if (texto.includes('simulacro')) {
                return "⏱️ El **Modo Simulacro** está en la pestaña Preguntas. Simula las condiciones reales del examen: 5 minutos para 5 preguntas, sin feedback durante la prueba, y al final obtienes un puntaje SIMO sobre 100. El corte de aprobación es 70/100. ¿Quieres más detalles?";
            }
            if (texto.includes('estudio')) {
                return "📚 El **Modo Estudio** está en la pestaña Preguntas. Es ideal para aprender sin presión: sin límite de tiempo, puedes intentar hasta 4 veces por pregunta, y recibes feedback inmediato con explicaciones. ¿Necesitas saber más?";
            }
            if (texto.includes('puntajes')) {
                return "📊 El **puntaje SIMO** se calcula como: (Aciertos al primer intento ÷ Total de preguntas) × 100. El corte de aprobación es 70/100. Por ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ. ¿Quieres que te explique más?";
            }
            if (texto.includes('puntaje')) {
                return "📊 El **puntaje SIMO** se calcula como: (Aciertos al primer intento ÷ Total de preguntas) × 100. El corte de aprobación es 70/100. Por ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ. ¿Quieres que te explique más?";
            }
            if (texto.includes('resultados')) {
                return "📊 Los **resultados** del examen muestran: puntaje total, aciertos vs total, y si APROBÓ o REPROBÓ. En Modo Estudio también se muestran iconos (✅, ⚠️, 🔴). ¿Necesitas más detalles?";
            }
            if (texto.includes('resultado')) {
                return "📊 Los **resultados** del examen muestran: puntaje total, aciertos vs total, y si APROBÓ o REPROBÓ. En Modo Estudio también se muestran iconos (✅, ⚠️, 🔴). ¿Necesitas más detalles?";
            }
            if (texto.includes('homeria') || texto.includes('homeris')) {
                return "🏥 **HOMERIS** (Hospital Mental de Risaralda) es la ESE especializada en salud mental donde muchos auxiliares de enfermería buscan ingresar mediante el concurso ESE 2 de la CNSC. ¿Necesitas información sobre los requisitos específicos?";
            }
            return "📌 No entendí bien qué palabra clave me escribiste. Las palabras que reconozco son: CNSC, SIMO, OPEC, glosario, simulacro, estudio, puntaje, resultados. ¿Puedes escribir una de ellas?";
        
        default:
            return "No encontré una respuesta exacta. Puedes consultar las instrucciones (📖) o usar el menú de ayuda escribiendo 'ayuda'.";
    }
}

// ============================================
// AGREGAR MENSAJE AL CHAT
// ============================================
function agregarMensaje(texto, esUsuario) {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    const div = document.createElement('div');
    div.className = `mensaje mensaje-${esUsuario ? 'usuario' : 'bot'}`;
    div.textContent = texto;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// ============================================
// PROCESAR PREGUNTA DEL USUARIO
// ============================================
function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    const pregunta = input.value.trim();
    if (!pregunta) return;
    
    agregarMensaje(pregunta, true);
    input.value = '';
    
    const respuesta = buscarRespuesta(pregunta);
    setTimeout(() => {
        agregarMensaje(respuesta, false);
    }, 300);
}

// ============================================
// ABRIR/CERRAR CHAT
// ============================================
function toggleAsistente() {
    const modal = document.getElementById('asistente-modal');
    const overlay = document.getElementById('asistente-overlay');
    
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        if (overlay) overlay.style.display = 'block';
        if (conocimientoData && conocimientoData.bienvenida) {
            const body = document.getElementById('asistente-body');
            if (body && body.children.length === 0) {
                agregarMensaje(conocimientoData.bienvenida, false);
            }
        }
    }
}

// ============================================
// INICIALIZAR ASISTENTE
// ============================================
async function initAsistente() {
    await cargarConocimiento();
    
    const btnPC = document.getElementById('asistente-btn');
    if (btnPC) btnPC.onclick = toggleAsistente;
    
    const btnHeader = document.getElementById('aiBtn');
    if (btnHeader) btnHeader.onclick = toggleAsistente;
    
    const closeBtn = document.getElementById('asistente-close');
    if (closeBtn) closeBtn.onclick = toggleAsistente;
    
    const sendBtn = document.getElementById('asistente-send');
    if (sendBtn) sendBtn.onclick = procesarPregunta;
    
    const input = document.getElementById('asistente-input');
    if (input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter') procesarPregunta();
        };
    }
    
    const overlay = document.getElementById('asistente-overlay');
    if (overlay) overlay.onclick = toggleAsistente;
}

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================
window.initAsistente = initAsistente;
window.toggleAsistente = toggleAsistente;