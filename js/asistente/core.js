// ============================================
// CORE - Funciones principales del chat (optimizado para móvil)
// ============================================

import { getConocimientoData } from './datos.js';
import { buscarRespuesta } from './respuestas.js';
import { calcularSimilitud } from './embeddings.js';

let historialConversacion = [];
let conocimientoData = getConocimientoData();
let mensajeBienvenida = null;

// Caché para similitudes (clave: pregunta|prototipo)
const cacheSimilitudes = new Map();

// ========== PROTOTIPOS COMPLETOS (para compatibilidad) ==========
const TEMAS_PROTOTIPOS_COMPLETOS = {
    'convocatoria': 'informacion sobre la convocatoria ese 2 vacantes inscripciones modalidades ascenso abierto requisitos fechas plazas. ¿Para qué sirve la convocatoria? ¿Qué utilidad tiene?',
    'simo': 'plataforma simo registro aplicativo. ¿Para qué sirve SIMO? ¿Qué función cumple?',
    'cnsc': 'comision nacional del servicio civil concurso de meritos carrera administrativa. ¿Para qué sirve la CNSC?',
    'pin': 'derecho de participacion pagar costo precio valor pago obtener. ¿Para qué sirve el PIN? ¿Qué utilidad tiene el PIN? ¿Qué función cumple?',
    'leyes': 'ley decreto resolucion norma ley 100 ley 1438 ley 1751 decreto 780 decreto 1011 resolucion 2292 resolucion 3100 resolucion 3280 resolucion 1995 resolucion 1444 resolucion 256. ¿Para qué sirven las leyes de salud? ¿Qué utilidad tienen?',
    'normas': 'normas del sector salud normatividad legislacion marco legal. ¿Para qué sirven las normas?',
    'casos practicos': 'caso practico casos practicos dilema etico situacion real competencia basica competencia funcional competencia comportamental. ¿Para qué sirven los casos prácticos? ¿En qué ayudan?',
    'procedimientos': 'procedimiento de enfermeria procedimientos cuidado protocolo seguridad del paciente medicacion valoracion cuidados basicos comunicacion contencion codigo azul. ¿Para qué sirven los procedimientos?',
    'glosario': 'termino siglas definicion significado diccionario filtrar filtro buscar ordenar clasificar. ¿Para qué sirve el glosario? ¿Con qué fin se usa?',
    'modo estudio': 'estudio aprender sin presion feedback inmediato varios intentos sin limite de tiempo. ¿Para qué sirve el modo estudio?',
    'modo simulacro': 'simulacro entrenar velocidad tiempo limite puntaje real 100 preguntas 60 segundos. ¿Para qué sirve el modo simulacro? ¿Para qué se usa?',
    'preguntas': 'pregunta examen test competencia selectores comenzar examen resultados puntaje simo aciertos aprobo reprobo. ¿Para qué sirve la sección de preguntas?',
    'ajustes': 'configuracion modo oscuro tamano letra fuente preferencias. ¿Para qué sirven los ajustes?',
    'asistente': 'chat bot ia inteligencia artificial preguntar respuesta automatica. ¿Para qué sirve el asistente?',
    'antecedentes': 'procuraduria policia contraloria fiscales judiciales disciplinarios certificado de antecedentes consultar. ¿Para qué sirven los antecedentes?',
    'exportar': 'pdf resultados pdf descargar resultados imprimir guardar resultados. ¿Para qué sirve exportar resultados?',
    'ayuda': 'instrucciones manual tutorial como usar funcionalidades. ¿Para qué sirve la ayuda?',
    'subir': 'boton subir flecha subir scroll arriba. ¿Para qué sirve el botón subir?',
    'competencias': 'competencias simo razonamiento logico matematico lectura etica trabajo en equipo orientacion al servicio',
    'resultados examen': 'calificacion puntaje nota aciertos fallos preguntas falladas',
    'tiempos': 'tiempo temporizador barra de tiempo segundos restantes',
    'historial': 'guardar progreso continuar examen retomar',
    'cancelar': 'cancelar examen borrar progreso'
};

// ========== PROTOTIPOS REDUCIDOS (solo temas comunes para detección rápida) ==========
const TEMAS_PROTOTIPOS_REDUCIDOS = {
    'convocatoria': 'informacion sobre la convocatoria ese 2 vacantes inscripciones modalidades ascenso abierto requisitos fechas plazas',
    'pin': 'derecho de participacion pagar costo precio valor pago obtener. ¿Para qué sirve el PIN?',
    'leyes': 'ley decreto resolucion norma ley 100 ley 1438 ley 1751 decreto 780. ¿Para qué sirven las leyes?',
    'modo simulacro': 'simulacro entrenar velocidad tiempo limite puntaje real 100 preguntas. ¿Para qué sirve el modo simulacro?',
    'glosario': 'termino siglas definicion significado diccionario filtrar filtro buscar ordenar clasificar. ¿Para qué sirve el glosario?',
    'casos practicos': 'caso practico casos practicos dilema etico situacion real. ¿Para qué sirven los casos prácticos?',
    'modo estudio': 'estudio aprender sin presion feedback inmediato varios intentos sin limite de tiempo'
};

// Umbrales
const UMBRAL_TEMA_PROPIO = 0.65;
const UMBRAL_PROPOSITO = 0.70;
const UMBRAL_COMPATIBILIDAD = 0.65;

// Prototipo de propósito
const PROTOTIPO_PROPOSITO = "¿para qué sirve? ¿qué utilidad tiene? ¿qué uso? ¿con qué finalidad? ¿para qué se usa? ¿qué función cumple?";

// ========== FUNCIÓN CON CACHÉ ==========
async function calcularSimilitudConCache(pregunta, prototipo) {
    const key = `${pregunta}|${prototipo}`;
    if (cacheSimilitudes.has(key)) {
        return cacheSimilitudes.get(key);
    }
    const similitud = await calcularSimilitud(pregunta, prototipo);
    cacheSimilitudes.set(key, similitud);
    return similitud;
}

// ========== DETECCIÓN DE TEMA PROPIO (solo con prototipos reducidos) ==========
async function preguntaTieneTemaPropio(pregunta) {
    // Preguntas muy cortas (menos de 4 palabras) generalmente no tienen tema propio
    const palabras = pregunta.trim().split(/\s+/).length;
    if (palabras <= 3) return false;
    
    for (const [tema, prototipo] of Object.entries(TEMAS_PROTOTIPOS_REDUCIDOS)) {
        const similitud = await calcularSimilitudConCache(pregunta, prototipo);
        if (similitud >= UMBRAL_TEMA_PROPIO) {
            console.log(`🔍 Pregunta "${pregunta}" tiene tema propio: ${tema} (similitud ${similitud.toFixed(3)})`);
            return true;
        }
    }
    return false;
}

// ========== COMPATIBILIDAD CON TEMA (usa prototipos completos) ==========
async function esTemaCompatible(tema, pregunta) {
    if (!tema) return false;
    const temaKey = tema.toLowerCase();
    const prototipo = TEMAS_PROTOTIPOS_COMPLETOS[temaKey];
    if (!prototipo) return false;
    const similitud = await calcularSimilitudConCache(pregunta, prototipo);
    console.log(`🔍 Compatibilidad tema "${temaKey}" con pregunta "${pregunta}": similitud ${similitud.toFixed(3)}`);
    return similitud >= UMBRAL_COMPATIBILIDAD;
}

// ========== DETECCIÓN DE PROPÓSITO ==========
async function esPreguntaDeProposito(pregunta) {
    // Si la pregunta es muy corta y no tiene signos, evitar falsos positivos
    const palabras = pregunta.trim().split(/\s+/).length;
    if (palabras <= 2 && !pregunta.includes('?')) return false;
    
    const similitud = await calcularSimilitudConCache(pregunta, PROTOTIPO_PROPOSITO);
    console.log(`🎯 Similitud con propósito: ${similitud.toFixed(3)} (pregunta: "${pregunta}")`);
    return similitud >= UMBRAL_PROPOSITO;
}

// ========== ENRIQUECIMIENTO CON CONTEXTO ==========
async function enriquecerConContexto(pregunta) {
    // 1. Detectar propósito (prioritario)
    const esPropositoGenerico = await esPreguntaDeProposito(pregunta);
    
    if (esPropositoGenerico && historialConversacion.length > 0) {
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

    // 2. Si la pregunta ya tiene su propio tema (detectado rápido), devolverla sin cambios
    if (await preguntaTieneTemaPropio(pregunta)) {
        return pregunta;
    }
    
    // 3. Intentar enriquecer con el último tema del historial (compatibilidad)
    if (historialConversacion.length > 0) {
        for (let i = historialConversacion.length - 1; i >= 0; i--) {
            const entry = historialConversacion[i];
            if (entry.rol === 'bot' && entry.tema && !entry.texto.includes('🤔 Te refieres a')) {
                if (await esTemaCompatible(entry.tema, pregunta)) {
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
// CARGAR BIENVENIDA (igual)
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
    historialConversacion.push({ rol: esUsuario ? 'usuario' : 'bot', texto: texto, tema: tema });
    if (historialConversacion.length > 10) historialConversacion.shift();
}

let estadoConfirmacion = {
    activo: false,
    preguntaOriginal: null,
    faqCandidata: null,
    respuestaCorrecta: null
};

export async function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    let textoUsuario = input.value.trim();
    if (!textoUsuario) return;

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

    // Saludos (lista completa, omitida por brevedad, pero mantenla igual a tu original)
    const saludos = [
        'hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'holis',
        'buena tarde', 'buena noche', 'buen dia',
        'saludo', 'saludos', 'hello', 'hi',
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

    const preguntaEnriquecida = await enriquecerConContexto(preguntaParaBuscar);
    console.log('🧠 Original:', textoUsuario);
    console.log('🧠 Pregunta a buscar:', preguntaParaBuscar);
    console.log('🧠 Enriquecida:', preguntaEnriquecida);
    const resultado = await buscarRespuesta(preguntaEnriquecida);
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