// ============================================
// DETECTOR - Detectar intención del usuario
// ============================================

export function detectarIntencion(texto) {
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
        // RESTO DE INTENCIONES
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