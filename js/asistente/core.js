// ============================================
// CORE - Funciones principales del chat (versión estable con palabras clave)
// ============================================

import { getConocimientoData } from './datos.js';
import { buscarRespuesta } from './respuestas.js';

let historialConversacion = [];
let conocimientoData = getConocimientoData();
let mensajeBienvenida = null;

// ========== LISTAS DE PALABRAS CLAVE PARA DETECCIÓN RÁPIDA ==========
const COMPATIBILIDAD = {
    'convocatoria': ['ese 2', 'vacantes', 'inscripciones', 'modalidades', 'ascenso', 'abierto', 'requisitos', 'fechas', 'plazas'],
    'simo': ['plataforma simo', 'aplicativo simo', 'registro simo'],
    'cnsc': ['comision nacional del servicio civil', 'concurso de meritos', 'carrera administrativa'],
    'pin': ['derecho de participacion', 'pagar', 'costo', 'precio', 'valor', 'pago', 'obtener'],
    'leyes': ['ley', 'decreto', 'resolucion', 'ley 100', 'ley 1438', 'ley 1751', 'decreto 780', 'decreto 1011'],
    'normas': ['normas del sector salud', 'normatividad', 'legislacion', 'marco legal'],
    'casos practicos': ['caso practico', 'casos practicos', 'dilema etico', 'situacion real'],
    'procedimientos': ['procedimiento de enfermeria', 'procedimientos', 'cuidado', 'protocolo', 'seguridad del paciente'],
    'glosario': ['termino', 'siglas', 'definicion', 'significado', 'diccionario', 'filtrar', 'filtro', 'buscar', 'ordenar'],
    'modo estudio': ['modo estudio', 'estudio', 'aprender sin presion', 'feedback inmediato', 'varios intentos', 'sin limite de tiempo'],
    'modo simulacro': ['simulacro', 'modo simulacro', 'entrenar velocidad', 'tiempo limite', 'puntaje real', '100 preguntas', '60 segundos'],
    'preguntas': ['pregunta', 'examen', 'test', 'competencia', 'selectores', 'comenzar examen', 'resultados', 'puntaje simo'],
    'ajustes': ['configuracion', 'modo oscuro', 'tamano letra', 'fuente', 'preferencias'],
    'asistente': ['chat', 'bot', 'ia', 'inteligencia artificial', 'preguntar', 'respuesta automatica'],
    'antecedentes': ['procuraduria', 'policia', 'contraloria', 'fiscales', 'judiciales', 'disciplinarios', 'certificado de antecedentes'],
    'exportar': ['pdf', 'resultados pdf', 'descargar resultados', 'imprimir', 'guardar resultados'],
    'ayuda': ['instrucciones', 'manual', 'tutorial', 'como usar', 'funcionalidades'],
    'subir': ['boton subir', 'flecha subir', 'scroll arriba'],
    'competencias': ['razonamiento logico', 'razonamiento matematico', 'comprension lectora', 'etica profesional', 'trabajo en equipo', 'orientacion al servicio'],
    'resultados examen': ['calificacion', 'puntaje', 'nota', 'aciertos', 'fallos', 'preguntas falladas'],
    'tiempos': ['temporizador', 'barra de tiempo', 'segundos restantes'],
    'historial': ['guardar progreso', 'continuar examen', 'retomar'],
    'cancelar': ['cancelar examen', 'borrar progreso'],
    'triage': ['triage', 'triaje', 'clasificacion', 'clasificaciones', 'tipos', 'niveles', 'prioridad', 'urgencias', 'codigo', 'atencion'],
    'bipolar': ['bipolar', 'trastorno bipolar', 'mania', 'depresion', 'ciclotimia', 'episodios', 'estabilizadores'],
    'depresion': ['depresion', 'tristeza', 'trastorno depresivo', 'antidepresivos', 'sintomas', 'tratamiento'],
    'ansiedad': ['ansiedad', 'ataque de panico', 'fobia', 'estres', 'ansioliticos', 'preocupacion'],
    'psicosis': ['psicosis', 'esquizofrenia', 'delirios', 'alucinaciones', 'antipsicoticos'],
    'farmacos': ['medicamentos', 'psicofarmacos', 'antidepresivos', 'antipsicoticos', 'estabilizadores', 'benzodiacepinas'],
    'niveles atencion': ['niveles de atencion', 'primario', 'secundario', 'terciario', 'complejidad'],
    'caidas': ['caidas', 'riesgo de caidas', 'morse', 'prevencion de caidas', 'barandas'],
    // ========== NUEVAS ENTRADAS PARA CONTEXTO CLÍNICO Y DE ENFERMERÍA ==========
    'esquizofrenia': ['esquizofrenia', 'psicosis', 'delirios', 'alucinaciones', 'trastorno psicotico', 'antipsicoticos'],
    'toc': ['toc', 'trastorno obsesivo compulsivo', 'obsesiones', 'compulsiones'],
    'tept': ['tept', 'estres postraumatico', 'trauma', 'estres post-traumatico', 'pesadillas'],
    'trastorno alimentario': ['anorexia', 'bulimia', 'trastorno alimentario', 'trastorno de la conducta alimentaria', 'atracones'],
    'tdah': ['tdah', 'deficit atencion', 'hiperactividad', 'trastorno por deficit de atencion', 'impulsividad'],
    'sustancias': ['abuso de sustancias', 'drogas', 'alcohol', 'farmacodependencia', 'adiccion', 'sustancias psicoactivas'],
    'panico': ['ataque de panico', 'crisis de panico', 'panic', 'agorafobia'],
    'ansiedad social': ['ansiedad social', 'fobia social', 'timidez extrema', 'miedo a hablar en publico'],
    'tag': ['tag', 'ansiedad generalizada', 'preocupacion excesiva'],
    'insomnio': ['insomnio', 'dificultad para dormir', 'trastorno del sueño', 'hipersomnia'],
    'demencia': ['demencia', 'alzheimer', 'deterioro cognitivo', 'perdida de memoria'],
    // Procedimientos y cuidados
    'administracion medicamentos': ['administracion de medicamentos', '5 correctos', 'dosis', 'via oral', 'via intravenosa', 'via intramuscular', 'inyeccion', 'jarabe'],
    'signos vitales': ['signos vitales', 'temperatura', 'pulso', 'respiracion', 'presion arterial', 'saturacion', 'toma de signos'],
    'curaciones': ['curacion', 'cura de heridas', 'aposito', 'vendaje', 'limpieza de herida', 'antisepsia'],
    'sondas': ['sonda nasogastrica', 'sonda vesical', 'sonda foley', 'colocacion de sonda', 'retiro de sonda'],
    'bioseguridad': ['bioseguridad', 'lavado de manos', 'guantes', 'bata', 'mascarilla', 'epi', 'residuos hospitalarios', 'gafas'],
    'rcp': ['rcp', 'reanimacion cardiopulmonar', 'codigo azul', 'paro cardiaco', 'maniobras de reanimacion', 'desfibrilador'],
    'contencion': ['contencion', 'contencion mecanica', 'contencion fisica', 'sujecion', 'paciente agresivo', 'crisis de agitacion'],
    'historia clinica': ['historia clinica', 'registro clinico', 'evolucion', 'nota de enfermeria', 'resolucion 1995'],
    'consentimiento informado': ['consentimiento informado', 'autorizacion', 'procedimiento invasivo', 'informacion al paciente', 'firma'],
    'escalas valoracion': ['escala morse', 'escala de braden', 'escala de glasgow', 'escala de downton', 'valoracion riesgo', 'escala de norton'],
    // Normas y entidades del sistema de salud
    'sgsss': ['sgsss', 'sistema general de seguridad social en salud', 'ley 100', 'seguridad social'],
    'eps': ['eps', 'entidad promotora de salud', 'aseguramiento'],
    'ips': ['ips', 'institucion prestadora de servicios de salud', 'clinica', 'hospital'],
    'ese': ['ese', 'empresa social del estado', 'hospital publico'],
    'adres': ['adres', 'administradora de recursos del sgsss', 'fosyga', 'giros'],
    'supersalud': ['supersalud', 'superintendencia nacional de salud', 'vigilancia', 'control', 'queja'],
    'pbs': ['pbs', 'plan de beneficios en salud', 'pos', 'servicios garantizados'],
    'rias': ['rias', 'rutas integrales de atencion en salud', 'ruta de atencion'],
    'sogc': ['sogc', 'sistema obligatorio de garantia de calidad', 'calidad', 'habilitacion', 'acreditacion'],
    'decreto1011': ['decreto 1011', 'decreto 1011 de 2006', 'sogc', 'calidad'],
    'decreto780': ['decreto 780', 'decreto unico reglamentario', 'compilado normas'],
    'resolucion2292': ['resolucion 2292', 'pbs', 'plan de beneficios'],
    'resolucion3100': ['resolucion 3100', 'habilitacion', 'estandares minimos'],
    'resolucion3280': ['resolucion 3280', 'rias', 'rutas atencion'],
    'resolucion1995': ['resolucion 1995', 'historia clinica', 'registros'],
    'resolucion1444': ['resolucion 1444', 'talento humano', 'recertificacion'],
    'resolucion256': ['resolucion 256', 'indicadores calidad', 'tasa errores'],
    // Competencias SIMO (refuerzo)
    'logica': ['razonamiento logico', 'silogismo', 'premisa', 'conclusion', 'contrarreciproco'],
    'matematicas': ['razonamiento matematico', 'regla de tres', 'porcentaje', 'dosis', 'calculo personal'],
    'lectura': ['comprension lectora', 'idea principal', 'inferencia', 'sinonimos', 'hecho vs opinion'],
    'etica': ['etica profesional', 'confidencialidad', 'reporte error', 'autonomia', 'dilema etico'],
    'trabajo equipo': ['trabajo en equipo', 'roles', 'cambio de turno', 'coordinacion', 'crisis'],
    'servicio': ['orientacion al servicio', 'empatia', 'comunicacion con familiares', 'paciente ansioso'],
    // Funcionalidades de la herramienta
    'guardar progreso': ['guardar progreso', 'cambiar pestaña', 'continuar examen', 'retomar examen'],
    'preguntas falladas': ['preguntas falladas', 'ver preguntas falladas', 'errores simulacro', 'fallos'],
    'exportar pdf': ['exportar pdf', 'descargar resultados', 'pdf simulacro', 'resultados pdf'],
    'modo oscuro': ['modo oscuro', 'tema oscuro', 'noche', 'oscurecer interfaz'],
    'tamaño letra': ['tamaño letra', 'fuente', 'agrandar letra', 'disminuir letra', 'zoom texto'],
    'boton subir': ['boton subir', 'flecha subir', 'scroll arriba', 'volver arriba', 'subir pagina'],
    'asistente ia': ['asistente', 'chat', 'bot', 'preguntar al asistente', 'ia', 'inteligencia artificial', 'confirmacion', 'zona gris'],
    'glosario': ['glosario', 'termino', 'definicion', 'siglas', 'buscar palabra', 'filtrar', 'categoria', 'letra inicial'],
    'casos practicos': ['caso practico', 'casos practicos', 'dilema etico', 'situacion real', 'respuesta orientativa'],
    'procedimientos': ['procedimiento de enfermeria', 'procedimientos', 'cuidado', 'protocolo', 'seguridad del paciente'],
    // Convocatoria y trámites
    'inscripciones': ['inscripciones', 'fechas inscripcion', 'segundo semestre 2026', 'julio agosto'],
    'modalidades': ['ascenso', 'abierto', 'ascenso general', 'abierto general', 'discapacidad', 'modalidad'],
    'pin': ['pin', 'costo pin', 'pago pin', 'recuperar pin', 'derecho participacion'],
    'antecedentes': ['procuraduria', 'policia', 'contraloria', 'fiscales', 'judiciales', 'disciplinarios', 'certificado'],
    'verificacion requisitos': ['verificacion requisitos', 'verificacion documental', 'requisitos minimos', 'subsanar'],
    'pruebas escritas': ['pruebas escritas', 'examen escrito', 'preguntas concurso', 'tiempo prueba'],
    'lista elegibles': ['lista elegibles', 'orden merito', 'resultados', 'publicacion resultados'],
    'periodo prueba': ['periodo prueba', 'periodo de prueba', 'seis meses', 'evaluacion desempeño'],
    'opec': ['opec', 'oferta publica empleo carrera', 'vacante', 'numero opec']
};

// Palabras clave para detectar preguntas de propósito (sin embeddings)
const PALABRAS_PROPOSITO = [
    'para qué sirve', 'qué utilidad tiene', 'qué uso', 'con qué finalidad',
    'para qué se usa', 'qué función cumple', 'en qué ayuda', 'para que sirve'
];

function esPreguntaDeProposito(pregunta) {
    const preguntaLower = pregunta.toLowerCase();
    return PALABRAS_PROPOSITO.some(frase => preguntaLower.includes(frase));
}

function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// ============================================
// CARGAR BIENVENIDA DESDE FAQS.TXT
// ============================================
async function cargarBienvenida() {
    try {
        const response = await fetch('datos/faqs.txt');
        const texto = await response.text();
        const lineas = texto.split('\n');
        for (const linea of lineas) {
            const lineaTrim = linea.trim();
            if (lineaTrim !== '' && !lineaTrim.startsWith('¿')) {
                let raw = "👋 " + lineaTrim;
                mensajeBienvenida = raw.replace(/\\n/g, '\n');
                break;
            }
        }
        if (!mensajeBienvenida) {
            mensajeBienvenida = "👋 ¡Hola! Soy tu asistente de ESTUDIO SIMO. ¿En qué puedo ayudarte?";
        }
    } catch (error) {
        console.error('Error cargando bienvenida:', error);
        mensajeBienvenida = "👋 ¡Hola! Soy tu asistente de ESTUDIO SIMO. ¿En qué puedo ayudarte?";
    }
}
cargarBienvenida();

export function agregarMensaje(texto, esUsuario, tema = null) {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = `mensaje mensaje-${esUsuario ? 'usuario' : 'bot'}`;
    div.textContent = texto;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    
    // Normalizar tema: eliminar artículos, espacios, minúsculas
    let temaNormalizado = tema;
    if (temaNormalizado) {
        temaNormalizado = temaNormalizado.toLowerCase()
            .replace(/^(el |la |los |las )/, '')  // quita artículo al inicio
            .trim();
    }
    historialConversacion.push({ rol: esUsuario ? 'usuario' : 'bot', texto: texto, tema: temaNormalizado });
    if (historialConversacion.length > 10) historialConversacion.shift();
}

let estadoConfirmacion = {
    activo: false,
    preguntaOriginal: null,
    faqCandidata: null,
    respuestaCorrecta: null
};

function esTemaCompatible(tema, pregunta) {
    if (!tema) return false;
    const temaKey = tema.toLowerCase();
    const palabrasClave = COMPATIBILIDAD[temaKey];
    if (!palabrasClave) return false;
    const preguntaLower = pregunta.toLowerCase();
    return palabrasClave.some(pc => preguntaLower.includes(pc));
}

function preguntaTieneTemaPropio(pregunta) {
    const preguntaNorm = normalizarTexto(pregunta);
    for (const clave of Object.keys(COMPATIBILIDAD)) {
        if (preguntaNorm.includes(normalizarTexto(clave))) return true;
    }
    return false;
}

function enriquecerConContexto(pregunta) {
    // 1. Detectar propósito por palabras clave (rápido)
    if (esPreguntaDeProposito(pregunta) && historialConversacion.length > 0) {
        for (let i = historialConversacion.length - 1; i >= 0; i--) {
            const entry = historialConversacion[i];
            if (entry.rol === 'bot' && entry.tema && !entry.texto.includes('🤔 Te refieres a')) {
                const tema = entry.tema;
                let temaCapitalizado = tema.charAt(0).toUpperCase() + tema.slice(1);
                const preguntaCanonica = `¿Para qué sirve ${temaCapitalizado}?`;
                console.log(`🔄 Reescribiendo propósito: "${pregunta}" -> "${preguntaCanonica}" (tema: ${tema})`);
                return preguntaCanonica;
            }
        }
    }

    // 2. Si la pregunta ya tiene su propio tema explícito, devolverla tal cual
    if (preguntaTieneTemaPropio(pregunta)) {
        return pregunta;
    }
    
    // 3. Intentar enriquecer con el último tema del historial (compatibilidad)
    if (historialConversacion.length > 0) {
        for (let i = historialConversacion.length - 1; i >= 0; i--) {
            const entry = historialConversacion[i];
            if (entry.rol === 'bot' && entry.tema && !entry.texto.includes('🤔 Te refieres a')) {
                if (esTemaCompatible(entry.tema, pregunta)) {
                    return `${pregunta} (refiriéndose a ${entry.tema})`;
                } else {
                    return pregunta;
                }
            }
        }
    }
    return pregunta;
}

// ============================================
// PROCESAR PREGUNTA CON ANIMACIÓN DE CARGA
// ============================================
export async function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    let textoUsuario = input.value.trim();
    if (!textoUsuario) return;

    // Manejo de confirmación pendiente
    if (estadoConfirmacion.activo) {
        agregarMensaje(textoUsuario, true);
        const respuestaUsuario = textoUsuario.toLowerCase();
        if (respuestaUsuario === 'sí' || respuestaUsuario === 'si' || respuestaUsuario === 's') {
            agregarMensaje(estadoConfirmacion.respuestaCorrecta, false);
        } else if (respuestaUsuario === 'no' || respuestaUsuario === 'n') {
            agregarMensaje("Entiendo. ¿Podrías reformular tu pregunta con más detalles? Así podré ayudarte mejor.", false);
        } else {
            agregarMensaje(`Por favor, responde con "sí" o "no". ¿Te referías a "${estadoConfirmacion.faqCandidata}"?`, false);
            input.value = '';
            return;
        }
        estadoConfirmacion.activo = false;
        estadoConfirmacion.preguntaOriginal = null;
        estadoConfirmacion.faqCandidata = null;
        estadoConfirmacion.respuestaCorrecta = null;
        input.value = '';
        return;
    }

    // Validación de saludos
    const saludos = [
        'hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'holis',
        'buena tarde', 'buena noche', 'buen dia', 'saludo', 'saludos', 'hello', 'hi',
        'quiubo', 'qué hubo', 'que hubo', 'quiubo parce', 'parce', 'parcero',
        'que más', 'qué más', 'que mas', 'entonces', 'tonces', 'o sea',
        'qué tal', 'que tal', 'cómo estás', 'como estas', 'cómo has estado', 'como has estado',
        'cómo vas', 'como vas', 'qué más pues', 'que mas pues',
        'oye', 'ey', 'hey', 'epa', 'alo', 'hola?', 'que mas parcero',
        'ayuda', 'auxilio', 'socorro', 'mano', 'chino', 'vecx', 'pana', 'llave',
        'comoves', 'comovai', 'tal', 'qhubo', 'qmas'
    ];

    const textoLower = textoUsuario.toLowerCase().trim();
    const numeroPalabras = textoLower.split(/\s+/).length;
    const esSaludo = (numeroPalabras <= 3) && saludos.some(saludo => 
        textoLower === saludo || 
        textoLower.startsWith(saludo + ' ') || 
        textoLower.endsWith(' ' + saludo) || 
        textoLower.includes(' ' + saludo + ' ')
    );
    if (esSaludo) {
        agregarMensaje(textoUsuario, true);
        agregarMensaje("👋 ¡Hola! ¿En qué puedo ayudarte con ESTUDIO SIMO? Pregúntame sobre modos de estudio, convocatoria, glosario, normas, etc. Recuerda enmarcar tu pregunta entre ¿ y ? para respuestas más precisas.", false);
        input.value = '';
        return;
    }

    // Extraer pregunta con signos
    let preguntaParaBuscar = textoUsuario;
    let tieneSignos = textoUsuario.startsWith('¿') && textoUsuario.endsWith('?');
    if (!tieneSignos) {
        const idxApertura = textoUsuario.indexOf('¿');
        const idxCierre = textoUsuario.lastIndexOf('?');
        if (idxApertura !== -1 && idxCierre !== -1 && idxCierre > idxApertura) {
            preguntaParaBuscar = textoUsuario.substring(idxApertura, idxCierre + 1);
            tieneSignos = true;
        }
    }

    if (!tieneSignos) {
        agregarMensaje(textoUsuario, true);
        agregarMensaje("❌ Para procesar tu pregunta, debe comenzar con el símbolo **¿** y terminar con **?**.\n\nEjemplo: ¿Qué es el modo estudio?\n\nPor favor, reformula tu pregunta usando ambos signos.", false);
        input.value = '';
        return;
    }

    agregarMensaje(textoUsuario, true);
    input.value = '';

    // Animación de carga
    const bodyChat = document.getElementById('asistente-body');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'mensaje mensaje-bot mensaje-carga';
    loadingDiv.innerHTML = '🤔 Pensando<span class="puntos">...</span>';
    bodyChat.appendChild(loadingDiv);
    bodyChat.scrollTop = bodyChat.scrollHeight;

    let preguntaEnriquecida, resultado;
    try {
        preguntaEnriquecida = enriquecerConContexto(preguntaParaBuscar);
        console.log('🧠 Original:', textoUsuario);
        console.log('🧠 Pregunta a buscar:', preguntaParaBuscar);
        console.log('🧠 Enriquecida:', preguntaEnriquecida);
        resultado = await buscarRespuesta(preguntaEnriquecida);
    } finally {
        if (loadingDiv && loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
    }

    console.log('📦 Resultado:', {
        necesitaConfirmacion: resultado.necesitaConfirmacion,
        tema: resultado.tema,
        respuesta: resultado.respuesta?.substring(0, 80)
    });

    if (resultado.necesitaConfirmacion) {
        estadoConfirmacion.activo = true;
        estadoConfirmacion.preguntaOriginal = preguntaParaBuscar;
        estadoConfirmacion.faqCandidata = resultado.tema;
        estadoConfirmacion.respuestaCorrecta = resultado.respuestaCorrecta;
        agregarMensaje(`🤔 Te refieres a "${resultado.tema}". Responde "sí" o "no".`, false);
    } else {
        agregarMensaje(resultado.respuesta, false, resultado.tema || null);
    }
}

function toggleBotonSubir(chatAbierto) {
    const btnSubirBiblio = document.getElementById('btn-subir-biblioteca');
    const btnSubirLey = document.getElementById('btn-subir-ley');
    if (chatAbierto) {
        if (btnSubirBiblio) btnSubirBiblio.style.display = 'none';
        if (btnSubirLey) btnSubirLey.style.display = 'none';
    } else {
        if (btnSubirBiblio) btnSubirBiblio.style.display = window.scrollY > 300 ? 'block' : 'none';
        if (btnSubirLey) btnSubirLey.style.display = window.scrollY > 300 ? 'block' : 'none';
    }
}

export function toggleAsistente() {
    const modal = document.getElementById('asistente-modal');
    const overlay = document.getElementById('asistente-overlay');
    if (modal.classList.contains('visible')) {
        modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
        setTimeout(() => {
            if (!modal.classList.contains('visible')) {
                modal.style.visibility = 'hidden';
                if (overlay) overlay.style.visibility = 'hidden';
                toggleBotonSubir(false);
            }
        }, 300);
    } else {
        modal.style.visibility = 'visible';
        if (overlay) overlay.style.visibility = 'visible';
        toggleBotonSubir(true);
        setTimeout(() => {
            modal.classList.add('visible');
            if (overlay) overlay.classList.add('visible');
        }, 10);
        const body = document.getElementById('asistente-body');
        if (body && body.children.length === 0 && mensajeBienvenida) {
            agregarMensaje(mensajeBienvenida, false);
        }
    }
}