// ============================================
// CORE - Funciones principales del chat
// ============================================

import { getConocimientoData } from './datos.js';
import { buscarRespuesta } from './respuestas.js';

let historialConversacion = [];
let conocimientoData = getConocimientoData();
let mensajeBienvenida = null;

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
    historialConversacion.push({ rol: esUsuario ? 'usuario' : 'bot', texto: texto, tema: tema });
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
    const temaLower = tema.toLowerCase();
    const preguntaLower = pregunta.toLowerCase();
    const compatibilidad = {
        'pin': ['pagar', 'costo', 'precio', 'valor', 'pago'],
        'antecedentes': ['antecedentes', 'procuraduría', 'policía', 'contraloría', 'fiscales', 'judiciales', 'disciplinarios'],
        'normas': ['normas', 'leyes', 'decretos', 'resoluciones', 'estudiar'],
        'glosario': ['glosario', 'términos', 'siglas', 'filtros'],
        'modo estudio': ['modo', 'estudio', 'simulacro', 'examen', 'practicar'],
        'exportar': ['exportar', 'pdf', 'resultados', 'imprimir']
    };
    for (const [clave, palabras] of Object.entries(compatibilidad)) {
        if (temaLower.includes(clave) || palabras.some(p => temaLower.includes(p))) {
            return palabras.some(p => preguntaLower.includes(p));
        }
    }
    return true;
}

function enriquecerConContexto(pregunta) {
    const preguntaLower = pregunta.toLowerCase();
    const pronombres = ['los', 'las', 'lo', 'la', 'ello', 'eso', 'allí', 'ahí', 'ese', 'esa', 'aquello'];
    const necesitaContexto = pronombres.some(p => preguntaLower.includes(p)) ||
                              (preguntaLower.includes('dónde') && preguntaLower.length < 15);
    if (necesitaContexto && historialConversacion.length > 0) {
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

export async function procesarPregunta() {
    const input = document.getElementById('asistente-input');
    let textoUsuario = input.value.trim();
    if (!textoUsuario) return;

    // ========== CASO 1: SALUDO PURO (≤ 3 palabras) ==========
    const saludos = [
        'hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches',
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
    // ========================================================

    // ========== EXTRAER LA PREGUNTA REAL (CASOS 4 y 5) ==========
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
    // ============================================================

    // ========== CASOS 2, 3, 4, 5: VALIDAR SIGNOS ==========
    if (!tieneSignos) {
        agregarMensaje(textoUsuario, true);
        agregarMensaje("❌ Para procesar tu pregunta, debe comenzar con el símbolo **¿** y terminar con **?**.\n\nEjemplo: ¿Qué es el modo estudio?\n\nPor favor, reformula tu pregunta usando ambos signos.", false);
        input.value = '';
        return;
    }
    // ====================================================

    // Mostrar el mensaje original del usuario
    agregarMensaje(textoUsuario, true);
    input.value = '';

    // Manejo de confirmación pendiente (sí/no)
    if (estadoConfirmacion.activo) {
        const respuestaUsuario = textoUsuario.toLowerCase();
        if (respuestaUsuario === 'sí' || respuestaUsuario === 'si' || respuestaUsuario === 's') {
            agregarMensaje(estadoConfirmacion.respuestaCorrecta, false);
        } else if (respuestaUsuario === 'no' || respuestaUsuario === 'n') {
            agregarMensaje("Entiendo. ¿Podrías reformular tu pregunta con más detalles? Así podré ayudarte mejor.", false);
        } else {
            agregarMensaje(`Por favor, responde con "sí" o "no". ¿Te referías a "${estadoConfirmacion.faqCandidata}"?`, false);
            return;
        }
        estadoConfirmacion.activo = false;
        estadoConfirmacion.preguntaOriginal = null;
        estadoConfirmacion.faqCandidata = null;
        estadoConfirmacion.respuestaCorrecta = null;
        return;
    }

    // Procesar la pregunta (usando la pregunta extraída)
    const preguntaEnriquecida = enriquecerConContexto(preguntaParaBuscar);
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