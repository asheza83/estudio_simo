// ============================================
// ASISTENTE IA - CHAT BÁSICO
// ============================================
export { initAsistente, toggleAsistente };

let conocimientoData = null;

// ============================================
// FUNCIÓN PARA LIMPIAR TEXTO (eliminar conectores)
// ============================================
function limpiarTexto(texto) {
    const palabrasVacias = [
        'de', 'la', 'con', 'como', 'y', 'el', 'los', 'las', 'un', 'una',
        'para', 'por', 'que', 'cual', 'cuál', 'qué', 'a', 'ante', 'bajo',
        'cabe', 'contra', 'desde', 'durante', 'en', 'entre', 'hacia',
        'hasta', 'mediante', 'según', 'sin', 'so', 'sobre', 'tras',
        'vs', 'vía', 'mi', 'tu', 'su', 'nuestro', 'es', 'son', 'está',
        'están', 'ser', 'sido', 'se', 'lo', 'le', 'les', 'os', 'nos',
        'me', 'te', 'al', 'del', 'cómo', 'dónde', 'cuándo', 'quién',
        'puedo', 'puede', 'puedes', 'quiero', 'saber', 'decir', 'hacer'
    ];
    
    let limpio = texto.toLowerCase()
        .replace(/[¿?¡!.,;:()]/g, '')
        .replace(/[áä]/g, 'a')
        .replace(/[éë]/g, 'e')
        .replace(/[íï]/g, 'i')
        .replace(/[óö]/g, 'o')
        .replace(/[úü]/g, 'u');
    
    const palabras = limpio.split(/\s+/);
    const filtradas = palabras.filter(p => !palabrasVacias.includes(p) && p.length > 1);
    
    return filtradas.join(' ');
}

// ============================================
// DETECCIÓN DE INTENCIÓN
// ============================================
function detectarIntencion(texto) {
    const intenciones = {
        RECUPERAR_PESTANAS: [
            'pestaña', 'pestañas', 'ocult', 'desapare', 'perd', 'escond',
            'dónde están', 'dónde quedaron', 'dónde están las',
            'volver a mostrar', 'recuperar', 'subir', 'botón subir', 'flecha',
            'se fueron', 'no veo las', 'cómo las recupero', 'cómo recupero',
            'cositas', 'arriba', 'botones', 'el otro', 'la otra',
            'se escondieron', 'las opciones', 'opciones de arriba',
            'se volvieron locas', 'huyeron', 'desaparecieron las',
            'no veo los botones', 'las tres cositas', 'se fueron las'
        ],
        GLOSARIO: [
            'glosario', 'término', 'sigla', 'definición', 'qué significa', 'buscar palabra',
            'filtro', 'categoría', 'letra inicial', 'paginación', 'diccionario',
            'significado de', 'qué es', 'qué quiere decir', 'palabras raras',
            'dónde busco términos', 'el diccionario ese'
        ],
        MODO_ESTUDIO: [
            'modo estudio', 'estudiar sin presión', 'feedback inmediato', 'verificar',
            'intentos', 'aprender', 'sin límite de tiempo', 'modo sin reloj',
            'el modo que no tiene tiempo', 'el que me dice si está bien',
            'respuesta inmediata', 'el que tiene explicaciones'
        ],
        MODO_SIMULACRO: [
            'simulacro', 'tiempo', 'temporizador', '5 minutos', 'puntaje',
            'aprob', 'reprob', 'corte', '70%', 'barra de progreso',
            'el modo con reloj', 'el que tiene tiempo', 'examen con tiempo',
            'el que tiene colores', 'barra verde', 'barra roja',
            'el modo ese que tiene un reloj', 'cuánto dura'
        ],
        BUSCAR_LEYES: [
            'buscar en leyes', 'buscador universal', 'normas', 'artículo',
            'encontrar artículo', 'buscar palabra en ley', 'eps', 'afiliación',
            'cómo busco una palabra', 'buscar en las normas', 'buscador de leyes',
            'el buscador ese', 'dónde busco artículos', 'buscar artículo'
        ],
        AJUSTES: [
            'ajustes', 'modo oscuro', 'tamaño de letra', 'letra más grande',
            'letra más pequeña', 'configuración', 'engranaje', 'luna',
            'el botón de la tuerca', 'la lunita', 'el engranaje',
            'cambiar tamaño letra', 'letra pequeña', 'letra grande',
            'fondo oscuro', 'pantalla oscura'
        ],
        CONVOCATORIA: [
            'convocatoria', 'inscripciones', 'vacantes', 'fechas', 'requisitos',
            'cómo me inscribo', 'cómo aplico', 'ESE 2', 'CNSC', 'SIMO',
            'concurso de méritos', 'cómo participar', 'cuándo empieza',
            'cuánto cuesta inscribirse', 'derechos de participación',
            'PIN', 'pago', 'etapas del concurso', 'listado de elegibles'
        ],
        RESULTADOS: [
            'puntaje', 'cálculo', 'aprob', 'reprob', 'corte de aprobación',
            'cómo se calcula el puntaje', 'qué nota necesito',
            'qué significa el fondo verde', 'qué significa fondo rojo',
            'qué significa el chulito', 'qué significa el triangulito',
            'iconos', 'resultados', 'nota', 'calificación'
        ],
        CASOS_PRACTICOS: [
            'casos prácticos', 'casos', 'dilemas éticos', 'situaciones reales',
            'casos clínicos', 'ver respuesta', 'respuesta orientativa', 'caso'
        ],
        ESTRUCTURA_APP: [
            'pestañas', 'estructura', 'cómo está organizado', 'qué pestañas hay',
            'cuántas pestañas', 'organización de la app'
        ],
        GUARDAR_PROGRESO: [
            'guardar progreso', 'se guarda', 'continuar después', 'cambiar de pestaña',
            'pierdo el progreso', 'se pierde lo que llevo'
        ],
        CANCELAR_EXAMEN: [
            'cancelar examen', 'botón cancelar', 'cancelar la prueba', 'borrar progreso'
        ],
        PERIODO_PRUEBA: [
            'período de prueba', 'periodo de prueba', 'prueba de 6 meses',
            'cuánto dura la prueba', 'empleado de carrera'
        ],
        DIFERENCIA_SIMO_MAESTRO: [
            'diferencia entre simo y sistema maestro', 'sistema maestro', 'docentes',
            'simo vs maestro', 'carrera docente'
        ],
        BOTON_INSTRUCCIONES: [
            'botón instrucciones', 'libro instrucciones', 'modal de bienvenida',
            'volver a ver la bienvenida', 'instrucciones de uso'
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
    let numero = null;
    if (texto.includes('1')) numero = 1;
    else if (texto.includes('2')) numero = 2;
    else if (texto.includes('3')) numero = 3;
    else if (texto.includes('4')) numero = 4;
    else if (texto.includes('5')) numero = 5;
    else if (texto.includes('6')) numero = 6;
    
    if (!numero) return null;
    
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

// ============================================
// GENERAR CONTRAPREGUNTAS (respuesta a preguntas ambiguas)
// ============================================
function generarContrapregunta(texto) {
    if (texto.includes('pestaña') || texto.includes('desapare') || texto.includes('ocult')) {
        return "⬆️ Las pestañas se ocultan al hacer scroll hacia abajo. Para recuperarlas, haz clic en el botón azul ↑ Subir (esquina inferior derecha). ¿Era ese tu problema?";
    }
    if (texto.includes('simulacro') || texto.includes('temporizador') || texto.includes('tiempo')) {
        return "⏱️ El simulacro tiene 5 minutos para 5 preguntas. ¿Qué problema específico tienes con el simulacro? (¿no empieza, se detiene, no muestra tiempo?)";
    }
    if (texto.includes('no funciona') || texto.includes('falla') || texto.includes('error')) {
        return "🔍 Para ayudarte mejor, dime: ¿Qué estabas haciendo? ¿Qué parte de la aplicación? (pestañas, exámenes, glosario, ajustes). ¿Ves algún mensaje de error?";
    }
    if (texto.includes('no sé') || texto.includes('no entiendo')) {
        return "📚 No te preocupes. Elige una opción:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario o búsqueda en leyes\n5️⃣ Recuperar pestañas\n6️⃣ Ajustes (modo oscuro, tamaño letra)";
    }
    if (texto.includes('ayuda')) {
        return "🤖 Puedo ayudarte con:\n\n1️⃣ Estudio SIMO\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Glosario / búsqueda en leyes\n5️⃣ Recuperar pestañas ocultas\n6️⃣ Ajustes (modo oscuro, tamaño letra)\n\nResponde con el número que te interesa.";
    }
    return "❓ No entendí bien. Elige una opción:\n1️⃣ Cómo usar las pestañas\n2️⃣ Modo Estudio\n3️⃣ Modo Simulacro\n4️⃣ Cómo buscar en Glosario o Leyes\n5️⃣ Recuperar pestañas ocultas\n6️⃣ Cambiar modo oscuro o tamaño de letra";
}

// ============================================
// DETECTAR SI LA PREGUNTA ES AMBIGUA
// ============================================
function esAmbigua(texto) {
    const palabrasAmbiguas = [
        'no funciona', 'no sirve', 'falla', 'error', 'problema', 'ayuda',
        'no sé', 'no entiendo', 'no puedo', 'no me deja', 'no carga',
        'se traba', 'se pega', 'lento', 'tarda', 'no responde'
    ];
    const palabras = texto.split(' ');
    if (palabras.length < 4) return true;
    for (const ambigua of palabrasAmbiguas) {
        if (texto.includes(ambigua)) return true;
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
    
    // 1. Verificar si es respuesta numérica
    const respuestaNumerica = procesarOpcionNumerica(texto);
    if (respuestaNumerica) return respuestaNumerica;
    
    // 2. Detectar ambigüedad
    if (esAmbigua(texto)) {
        return generarContrapregunta(texto);
    }
    
    // 3. Detectar intención normal
    const intencion = detectarIntencion(texto);
    
    // Respuestas según intención
    switch(intencion) {
        case 'RECUPERAR_PESTANAS':
            return "⬆️ Cuando te desplaces hacia abajo, las pestañas se ocultan. Usa el botón ↑ Subir (esquina inferior derecha) para recuperarlas.";
        
        case 'GLOSARIO':
            return "📖 El glosario tiene más de 140 términos. Para buscar, escribe una palabra (mínimo 3 letras) y presiona Enter. Las coincidencias se resaltan en amarillo. También puedes filtrar por categoría (siglas, entidades, términos, principios, carrera).";
        
        case 'MODO_ESTUDIO':
            return "📚 Modo Estudio: Sin límite de tiempo, feedback inmediato, puedes intentar hasta 4 veces por pregunta. Ideal para aprender.";
        
        case 'MODO_SIMULACRO':
            return "⏱️ Modo Simulacro: 5 minutos fijos para 5 preguntas, sin feedback durante el examen. Solo el primer intento cuenta. Puntaje = (aciertos ÷ 5) × 100. Corte de aprobación: 70/100.";
        
        case 'BUSCAR_LEYES':
            return "🔍 Para buscar en leyes: Ve a Estudio SIMO > Normas del sector salud. Escribe una palabra (ej: EPS, artículo 157) y presiona Enter. Haz clic en cualquier resultado para ver el artículo completo.";
        
        case 'AJUSTES':
            return "⚙️ Botón Ajustes (arriba a la derecha): Activa modo oscuro o cambia el tamaño de letra (4 tamaños: pequeña, normal, grande, extra grande).";
        
        case 'CONVOCATORIA':
            return "📋 Convocatoria ESE 2: Inscripciones en julio-agosto 2026. 2.477 vacantes en 72 ESE. Modalidades: ascenso general (184), ascenso discapacidad (3), abierto general (2.293), abierto discapacidad (194).";
        
        case 'RESULTADOS':
            return "📊 Puntaje = (Aciertos al primer intento ÷ Total preguntas) × 100. Corte de aprobación: 70/100. Ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ.";
        
        case 'CASOS_PRACTICOS':
            return "🩺 Casos prácticos: Situaciones reales clasificadas por competencia. Tienen filtros (TODAS, Básicas, Funcionales, Comportamentales) y paginación de 10 casos por página. Las respuestas son orientativas y se despliegan haciendo clic.";
        
        case 'ESTRUCTURA_APP':
            return "📌 La aplicación tiene 3 pestañas:\n\n📚 Estudio SIMO: Convocatoria, normas y casos\n📝 Preguntas: Modo Estudio y Simulacro\n📖 Glosario: Más de 140 términos con buscador";
        
        case 'GUARDAR_PROGRESO':
            return "💾 Si cambias de pestaña durante un examen, el sistema guarda automáticamente tu avance. Al volver, puedes continuar donde lo dejaste.";
        
        case 'CANCELAR_EXAMEN':
            return "❌ El botón Cancelar examen (rojo) borra todo el progreso de la prueba actual y vuelve a la pantalla de selección de competencias.";
        
        case 'PERIODO_PRUEBA':
            return "📋 El período de prueba es de seis meses después del nombramiento. Si lo superas, adquieres derechos de carrera administrativa.";
        
        case 'DIFERENCIA_SIMO_MAESTRO':
            return "📋 SIMO es de la CNSC para concursos de carrera administrativa. El Sistema Maestro es del Ministerio de Educación para docentes (nombramiento provisional, no genera derechos de carrera).";
        
        case 'BOTON_INSTRUCCIONES':
            return "📖 El botón Instrucciones abre el modal de bienvenida, donde se explica el funcionamiento de la aplicación. También aparece automáticamente la primera vez que ingresas.";
        
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