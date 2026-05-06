// ============================================
// ASISTENTE IA - CHAT BÁSICO
// ============================================
// Exportar funciones para usar en index.html
export { initAsistente, toggleAsistente };

let conocimientoData = null;

// Cargar conocimiento desde JSON
async function cargarConocimiento() {
    try {
        const response = await fetch('datos/ia-conocimiento.json');
        conocimientoData = await response.json();
        console.log('✅ Asistente IA: conocimiento cargado');
    } catch (error) {
        console.error('❌ Error cargando conocimiento:', error);
    }
}

// Buscar respuesta en el JSON
function buscarRespuesta(pregunta) {
    if (!conocimientoData) return "Lo siento, aún no estoy listo. Intenta más tarde.";
    
    const texto = pregunta.toLowerCase();
    
    // Buscar en FAQ general
    if (conocimientoData.faqGeneral) {
        for (const item of conocimientoData.faqGeneral) {
            if (texto.includes(item.pregunta.toLowerCase().substring(0, 20))) {
                return item.respuesta;
            }
        }
    }
    
    // Buscar palabras clave en las pestañas
    const pestanas = conocimientoData.pestanas;
    if (pestanas) {
        // Buscar en Estudio SIMO
        if (texto.includes('estudio') || texto.includes('simo') || texto.includes('convocatoria') || texto.includes('normas')) {
            const estudio = pestanas.estudioSIMO;
            if (estudio) return `${estudio.titulo}\n\n${estudio.descripcion}`;
        }
        
        // Buscar en Preguntas
        if (texto.includes('pregunta') || texto.includes('examen') || texto.includes('estudio') || texto.includes('simulacro') || texto.includes('modo')) {
            const preguntas = pestanas.preguntas;
            if (preguntas) return `${preguntas.titulo}\n\n${preguntas.descripcion}\n\nModos disponibles:\n- ${preguntas.modos[0].nombre}: ${preguntas.modos[0].descripcion}\n- ${preguntas.modos[1].nombre}: ${preguntas.modos[1].descripcion}`;
        }
        
        // Buscar en Glosario
        if (texto.includes('glosario') || texto.includes('término') || texto.includes('sigla')) {
            const glosario = pestanas.glosario;
            if (glosario) {
                let caracteristicasTexto = '';
                if (Array.isArray(glosario.caracteristicas)) {
                    caracteristicasTexto = glosario.caracteristicas.join('\n');
                } else if (typeof glosario.caracteristicas === 'object') {
                    caracteristicasTexto = Object.values(glosario.caracteristicas).join('\n');
                } else {
                    caracteristicasTexto = glosario.caracteristicas || 'No hay características disponibles.';
                }
                return `${glosario.titulo}\n\n${glosario.descripcion}\n\nCaracterísticas:\n${caracteristicasTexto}`;
            }        
        }
    }
    
    // Buscar en consejos rápidos
    if (conocimientoData.consejosRapidos) {
        for (const consejo of conocimientoData.consejosRapidos) {
            if (texto.includes(consejo.toLowerCase().substring(0, 15))) {
                return consejo;
            }
        }
    }
    
    // Buscar en funcionalidades globales
    const funcionalidades = conocimientoData.funcionalidadesGlobales;
    if (funcionalidades) {
        for (const [key, value] of Object.entries(funcionalidades)) {
            if (texto.includes(key) || texto.includes(value.titulo.toLowerCase())) {
                return `${value.titulo}\n${value.descripcion}`;
            }
        }
    }
    
    // Si no encuentra, dar respuesta genérica
    return "No encontré una respuesta exacta. Puedes consultar las instrucciones (📖) o revisar el glosario. También puedes preguntar sobre: modo estudio, modo simulacro, glosario, convocatoria, ajustes, o cómo empezar.";
}

// Agregar mensaje al chat
function agregarMensaje(texto, esUsuario) {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    const div = document.createElement('div');
    div.className = `mensaje mensaje-${esUsuario ? 'usuario' : 'bot'}`;
    div.textContent = texto;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// Procesar pregunta del usuario
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

// Abrir/cerrar chat
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

// Inicializar asistente
async function initAsistente() {
    await cargarConocimiento();
    
    const btn = document.getElementById('asistente-btn');
    if (btn) btn.addEventListener('click', toggleAsistente);
    
    const closeBtn = document.getElementById('asistente-close');
    if (closeBtn) closeBtn.addEventListener('click', toggleAsistente);
    
    const sendBtn = document.getElementById('asistente-send');
    if (sendBtn) sendBtn.addEventListener('click', procesarPregunta);
    
    const input = document.getElementById('asistente-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') procesarPregunta();
        });
    }
    
    // ✅ NUEVO: Cerrar chat al hacer clic en el overlay
    const overlay = document.getElementById('asistente-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleAsistente);
    }
}

// Exportar para uso global
window.initAsistente = initAsistente;
window.toggleAsistente = toggleAsistente;