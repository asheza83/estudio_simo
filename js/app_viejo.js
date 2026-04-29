// ============================================
// ESTUDIO SIMO - ENFERMERÍA
// Lógica principal de la aplicación
// Versión con feedback cruzado + modal de ajustes
// ============================================

// Variables globales
let leyesDisponibles = [];
let leyActual = null;
let preguntasBanco = [];
let preguntasActuales = [];
let preguntaActualIndex = 0;
let respuestasUsuario = [];
let modoOscuro = false;

// Constantes
const PREGUNTAS_POR_SESION = 5;

// Tamaño de letra
let tamañoLetraActual = 'font-normal';
const tamañosLetra = ['font-small', 'font-normal', 'font-large', 'font-xlarge'];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    inicializarEventos();
    cargarModoOscuro();
    cargarTamañoLetra();
    initConfiguracion();
    mostrarPantallaPrincipal();
    initMenuHamburguesa();
});

async function cargarDatosIniciales() {
    try {
        const responseIndex = await fetch('index.json');
        const dataIndex = await responseIndex.json();
        leyesDisponibles = dataIndex.leyes;
        
        const responsePreguntas = await fetch('datos/preguntas.json');
        const dataPreguntas = await responsePreguntas.json();
        preguntasBanco = dataPreguntas.preguntas;
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarError('Error al cargar los datos. Asegúrate de que todos los archivos existan.');
    }
}

function inicializarEventos() {
    // Eventos ya se inicializan en initConfiguracion
}

// ============================================
// MODO OSCURO
// ============================================
function actualizarColorBotonAjustes() {
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        if (document.body.classList.contains('dark-mode')) {
            configBtn.style.color = 'white';
        } else {
            configBtn.style.color = '';
        }
    }
}

function toggleModoOscuro() {
    modoOscuro = !modoOscuro;
    if (modoOscuro) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('simoModoOscuro', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('simoModoOscuro', 'false');
    }
    actualizarTextoBotonModoOscuro();
    actualizarColorBotonAjustes();
}

function cargarModoOscuro() {
    const guardado = localStorage.getItem('simoModoOscuro');
    if (guardado === 'true') {
        modoOscuro = true;
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    actualizarTextoBotonModoOscuro();
    actualizarColorBotonAjustes();
}

function actualizarTextoBotonModoOscuro() {
    const modalDarkModeBtn = document.getElementById('modalDarkModeToggle');
    if (modalDarkModeBtn) {
        modalDarkModeBtn.textContent = modoOscuro ? '☀️ Desactivar' : '🌙 Activar';
    }
}

// ============================================
// TAMAÑO DE LETRA
// ============================================
function cargarTamañoLetra() {
    const guardado = localStorage.getItem('simoTamañoLetra');
    if (guardado && tamañosLetra.includes(guardado)) {
        tamañoLetraActual = guardado;
        document.body.classList.add(tamañoLetraActual);
    } else {
        document.body.classList.add('font-normal');
    }
}

function cambiarTamañoLetra(direccion) {
    const idxActual = tamañosLetra.indexOf(tamañoLetraActual);
    let nuevoIdx = idxActual + direccion;
    
    if (nuevoIdx >= 0 && nuevoIdx < tamañosLetra.length) {
        document.body.classList.remove(tamañoLetraActual);
        tamañoLetraActual = tamañosLetra[nuevoIdx];
        document.body.classList.add(tamañoLetraActual);
        localStorage.setItem('simoTamañoLetra', tamañoLetraActual);
    }
}

// ============================================
// CONFIGURACIÓN (Modal)
// ============================================
function initConfiguracion() {
    const modal = document.getElementById('configModal');
    const configBtn = document.getElementById('configBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const modalDarkModeBtn = document.getElementById('modalDarkModeToggle');
    const modalFontDecrease = document.getElementById('modalFontDecrease');
    const modalFontIncrease = document.getElementById('modalFontIncrease');
    
    if (!configBtn || !modal) return;
    
    configBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    if (modalDarkModeBtn) {
        modalDarkModeBtn.addEventListener('click', () => {
            toggleModoOscuro();
        });
    }
    
    if (modalFontDecrease) {
        modalFontDecrease.addEventListener('click', () => {
            cambiarTamañoLetra(-1);
        });
    }
    
    if (modalFontIncrease) {
        modalFontIncrease.addEventListener('click', () => {
            cambiarTamañoLetra(1);
        });
    }
}

// ============================================
// NAVEGACIÓN DE PESTAÑAS
// ============================================
function cambiarPestana(pestanaId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(pestanaId).classList.add('active');
    
    if (pestanaId === 'tab-glosario') {
        if (typeof mostrarGlosario === 'function') {
            mostrarGlosario();
        }
    }
}

// ============================================
// PANTALLA PRINCIPAL (MENÚ DE LEYES)
// ============================================
function mostrarPantallaPrincipal() {
    const contenido = document.getElementById('contenido-ley');
    
    const grupos = {
        ley: { titulo: '📌 Leyes', leyes: [] },
        decreto: { titulo: '📌 Decretos', leyes: [] },
        resolucion: { titulo: '📌 Resoluciones', leyes: [] }
    };
    
    leyesDisponibles.forEach(ley => {
        if (grupos[ley.tipo]) {
            grupos[ley.tipo].leyes.push(ley);
        }
    });
    
    let html = '<div class="leyes-menu">';
    
    for (const [tipo, grupo] of Object.entries(grupos)) {
        if (grupo.leyes.length > 0) {
            html += `<div class="grupo-leyes">`;
            html += `<div class="grupo-titulo">${grupo.titulo}</div>`;
            grupo.leyes.forEach(ley => {
                html += `<button class="boton-ley" onclick="cargarLey('${ley.id}')">📄 ${ley.nombre}</button>`;
            });
            html += `</div>`;
        }
    }
    
    // CAMBIO 3: Botón IR A PREGUNTAS eliminado de la biblioteca
    html += `</div>`;
    
    contenido.innerHTML = html;
}

function irAPreguntas() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-preguntas').classList.add('active');
    document.querySelector('.tab-button:nth-child(3)').classList.add('active');
}

// ============================================
// CARGA DE LEY
// ============================================
async function cargarLey(leyId) {
    try {
        const ley = leyesDisponibles.find(l => l.id === leyId);
        const response = await fetch(ley.archivo);
        leyActual = await response.json();
        mostrarVistaLey();
    } catch (error) {
        console.error('Error cargando ley:', error);
        mostrarError('Error al cargar la ley seleccionada.');
    }
}

function mostrarVistaLey() {
    const contenido = document.getElementById('contenido-ley');
    
    let html = `<button class="boton-volver" onclick="mostrarPantallaPrincipal()">← VOLVER A BIBLIOTECA</button>`;
    html += `<h2>${leyActual.nombre}</h2>`;
    html += `<p><strong>${leyActual.tituloCompleto}</strong></p>`;
    html += `<p><em>Fecha: ${leyActual.fecha} | Estado: ${leyActual.estado}</em></p>`;
    
    html += `<h3>📖 Resumen</h3>`;
    html += `<p>${leyActual.resumen}</p>`;
    
    // Nota informativa
    html += `
        <div style="background-color: var(--azul); color: white; padding: 12px 15px; border-radius: 10px; margin: 15px 0;">
            <p style="margin: 0; font-size: 1.1rem;">
                📌 <strong>Información importante:</strong><br>
                Los artículos que aparecen en "Artículos destacados" son los de <strong>mayor relevancia para el perfil de enfermería</strong> 
                y para los concursos de méritos en ESE. Para consultar cualquier otro artículo, use el <strong>buscador</strong> o el botón 
                <strong>"VER TEXTO COMPLETO"</strong> al final de la página.
            </p>
        </div>
    `;
    
    // Sistema de Salud - Títulos informativos
    html += `<h3>🏥 Sistema General de Seguridad Social en Salud (SGSSS)</h3>`;
    html += `<div class="indice">`;
    
    const libroSalud = leyActual.indice.find(item => item.libro === "Libro III");
    if (libroSalud && libroSalud.subtitulos) {
        libroSalud.subtitulos.forEach(sub => {
            const nombreTitulo = sub.nombre;
            let descripcionTitulo = "";
            
            if (nombreTitulo.includes("Título I") || nombreTitulo.includes("Principios y definiciones")) {
                descripcionTitulo = "Define los principios rectores del SGSSS (universalidad, solidaridad, equidad, calidad, eficiencia) y los conceptos básicos del sistema de salud.";
            } else if (nombreTitulo.includes("Título II") || nombreTitulo.includes("Regímenes de afiliación")) {
                descripcionTitulo = "Explica los dos regímenes de afiliación (Contributivo y Subsidiado), las entidades EPS e IPS, y la organización de las Empresas Sociales del Estado (ESE).";
            } else {
                descripcionTitulo = "Consulta los artículos destacados o usa el buscador para más información específica.";
            }
            
            html += `
                <div style="margin: 15px 0; padding: 12px; background-color: var(--bg-principal); border-radius: 8px; border-left: 3px solid var(--azul);">
                    <div style="font-weight: bold; font-size: 1rem; color: var(--azul); margin-bottom: 8px;">📌 ${nombreTitulo}</div>
                    <div style="font-size: 1.3rem; color: var(--texto-secundario);">${descripcionTitulo}</div>
                </div>
            `;
        });
    }
    html += `</div>`;
    
    // Buscador
    html += `<h3>🔍 Buscar artículo</h3>`;
    html += `<input type="text" id="buscadorArticulo" class="buscador" placeholder="Ej: 153, 157, 202..." onkeyup="buscarArticuloPorNumero(this.value)">`;
    html += `<div id="resultadoBusqueda"></div>`;
    
    // Artículos destacados
    html += `<h3>📌 Artículos destacados para enfermería</h3>`;
    html += `<p style="font-size: 0.85rem; color: var(--texto-secundario); margin-bottom: 10px;">⬇️ Haz clic en cualquier artículo para ver su contenido</p>`;
    html += `<div class="indice">`;
    leyActual.articulosDestacados.forEach(art => {
        html += `<div class="articulo-item" onclick="mostrarArticulo('${art.numero}')">📄 ${art.numero}: ${art.descripcion}</div>`;
    });
    html += `</div>`;
    
    // CAMBIO 2: Botón toggle - cambia texto al mostrarlo
    html += `<button class="boton-volver" style="margin-top:20px;" id="btnTextoCompleto" onclick="toggleTextoCompleto()">📄 VER TEXTO COMPLETO</button>`;
    html += `<div id="textoCompleto" style="display:none;" class="texto-completo">${leyActual.textoCompleto.replace(/\n/g, '<br>')}</div>`;
    
    contenido.innerHTML = html;
}

// CAMBIO 2: Función toggle que cambia el texto del botón
function toggleTextoCompleto() {
    const div = document.getElementById('textoCompleto');
    const btn = document.getElementById('btnTextoCompleto');
    
    if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'block';
        btn.textContent = '📄 OCULTAR TEXTO COMPLETO';
    } else {
        div.style.display = 'none';
        btn.textContent = '📄 VER TEXTO COMPLETO';
    }
}

// Mantenida por compatibilidad con el popup
function mostrarTextoCompleto() {
    toggleTextoCompleto();
}

function buscarArticuloPorNumero(numero) {
    const resultadoDiv = document.getElementById('resultadoBusqueda');
    if (!numero || numero.trim() === '') {
        resultadoDiv.innerHTML = '';
        return;
    }
    
    const numeroLimpio = numero.trim().toLowerCase();
    
    const encontrados = leyActual.articulosDestacados.filter(art => 
        art.numero.toLowerCase().includes(numeroLimpio)
    );
    
    let coincidenciasEnTexto = [];
    if (leyActual.textoCompleto) {
        const lineas = leyActual.textoCompleto.split('\n');
        lineas.forEach((linea) => {
            if (linea.toLowerCase().includes(`artículo ${numeroLimpio}`) || 
                linea.toLowerCase().includes(`(artículo ${numeroLimpio})`)) {
                coincidenciasEnTexto.push(linea.trim());
            }
        });
    }
    
    if (encontrados.length > 0 || coincidenciasEnTexto.length > 0) {
        let html = '<h4>📌 Resultados encontrados:</h4>';
        
        encontrados.forEach(art => {
            html += `<div class="articulo-item" onclick="mostrarArticulo('${art.numero}')">
                        <strong>${art.numero}</strong>: ${art.descripcion}
                     </div>`;
        });
        
        coincidenciasEnTexto.forEach(texto => {
            html += `<div class="articulo-item" style="opacity:0.8;">
                        📄 ${texto.substring(0, 100)}...
                     </div>`;
        });
        
        resultadoDiv.innerHTML = html;
    } else {
        resultadoDiv.innerHTML = `<p>🔍 No se encontró el artículo ${numero}. Sugerencias: 153, 157, 162, 180, 182, 202, 204, 211, 218</p>`;
    }
}

// CAMBIO 1: Popup corregido - busca texto real, SIN botón duplicado
// CAMBIO 1: Popup corregido - funciona con el formato REAL del texto
function mostrarArticulo(numeroArticulo) {
    const articuloInfo = leyActual.articulosDestacados?.find(art => art.numero === numeroArticulo);
    
    let textoArticulo = "";
    
    if (articuloInfo) {
        textoArticulo = `<strong>📌 ${articuloInfo.descripcion}</strong><br><br>`;
    }
    
    if (leyActual.textoCompleto) {
        const textoCompleto = leyActual.textoCompleto;
        
        // Extraer el número sin "Artículo "
        const numeroSimple = numeroArticulo.replace(/Artículo\s*/i, '').trim();
        
        // Dividir por líneas
        const lineas = textoCompleto.split('\n');
        let encontrado = false;
        let textoEncontrado = '';
        
        // Primero intentar buscar línea por línea
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            
            // Buscar "Artículo 192:" o "Artículo 192." o "Artículo 192 "
            const regexArticulo = new RegExp(`Artículo\\s+${numeroSimple}[\\s\\.\\:\\-]`, 'i');
            
            if (regexArticulo.test(linea)) {
                textoEncontrado += linea + '\n';
                
                // Buscar las siguientes líneas hasta encontrar OTRO artículo
                for (let j = i + 1; j < lineas.length; j++) {
                    // Si la línea empieza con "Artículo" seguido de un número, PARAR
                    if (/^Artículo\s+\d+/i.test(lineas[j].trim())) {
                        break;
                    }
                    textoEncontrado += lineas[j] + '\n';
                }
                encontrado = true;
                break;
            }
        }
        
        // Si no encontró por líneas, buscar en TODO el texto
        if (!encontrado) {
            // Buscar la posición del artículo en el texto completo
            const regexGlobal = new RegExp(`Artículo\\s+${numeroSimple}[\\s\\.\\:\\-]`, 'i');
            const match = textoCompleto.match(regexGlobal);
            
            if (match) {
                const inicio = match.index;
                
                // Buscar el siguiente "Artículo" después de este
                const resto = textoCompleto.substring(inicio + match[0].length);
                const siguienteArticulo = resto.search(/Artículo\s+\d+/i);
                
                let fin;
                if (siguienteArticulo !== -1) {
                    fin = inicio + match[0].length + siguienteArticulo;
                } else {
                    // Si no hay siguiente artículo, tomar hasta 500 caracteres
                    fin = Math.min(inicio + 500, textoCompleto.length);
                }
                
                textoEncontrado = textoCompleto.substring(inicio, fin).trim();
                encontrado = true;
            }
        }
        
        if (encontrado && textoEncontrado.trim().length > 0) {
            textoArticulo += textoEncontrado.replace(/\n/g, '<br>');
        } else {
            textoArticulo += `Contenido del ${numeroArticulo} de ${leyActual.nombre}.<br><br>`;
            textoArticulo += `📍 Este artículo no tiene contenido detallado en el resumen. Desplázate al final de la página (en la sección o menú Biblioteca) y usa el botón "VER TEXTO COMPLETO" para buscar el texto completo de la ley.`;
        }
    }
    
    // Cerrar modal existente
    const modalExistente = document.getElementById('modalArticulo');
    if (modalExistente) modalExistente.remove();
    
    // Crear modal
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalArticulo';
    modalDiv.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;';
    
    modalDiv.innerHTML = `
        <div style="background:var(--bg-secundario); max-width:500px; width:100%; border-radius:12px; padding:20px; max-height:80%; overflow-y:auto;">
            <h3>${numeroArticulo}</h3>
            <div style="margin-top:15px; line-height:1.6;">${textoArticulo}</div>
            <button class="boton-volver" style="margin-top:20px;" onclick="cerrarModal()">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modalDiv);
}

function cerrarModal() {
    const modal = document.getElementById('modalArticulo');
    if (modal) modal.remove();
}

// ============================================
// SISTEMA DE PREGUNTAS CON FEEDBACK CRUZADO
// ============================================
function inicializarPreguntas() {
    if (!preguntasBanco || preguntasBanco.length === 0) {
        document.getElementById('preguntas-container').innerHTML = '<p>❌ Error: No hay preguntas disponibles.</p>';
        return;
    }
    
    const preguntasMezcladas = [...preguntasBanco].sort(() => Math.random() - 0.5);
    preguntasActuales = preguntasMezcladas.slice(0, PREGUNTAS_POR_SESION);
    preguntaActualIndex = 0;
    respuestasUsuario = preguntasActuales.map(() => ({
        intentos: 0,
        respondida: false,
        respuestaFinal: null,
        opcionesMostradas: null
    }));
    
    mostrarPregunta();
    actualizarProgreso();
}

function generarOpciones(pregunta) {
    const correcta = pregunta.respuestaCorrecta;
    
    const otrasRespuestas = preguntasBanco
        .filter(p => p.id !== pregunta.id)
        .map(p => p.respuestaCorrecta);
    
    const distractores = [...new Set(otrasRespuestas)]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    const distractoresGenericos = [
        "Ley 1122 de 2007",
        "Ley 1438 de 2011",
        "Decreto 780 de 2016",
        "Resolución 3280 de 2018"
    ];
    
    while (distractores.length < 3) {
        const gen = distractoresGenericos[distractores.length % distractoresGenericos.length];
        if (!distractores.includes(gen) && gen !== correcta) {
            distractores.push(gen);
        }
    }
    
    const opciones = [
        { texto: correcta, esCorrecta: true, feedback: pregunta.explicacion },
        ...distractores.map(d => {
            const preguntaOrigen = preguntasBanco.find(p => p.respuestaCorrecta === d);
            return {
                texto: d,
                esCorrecta: false,
                feedback: `❌ Incorrecto. "${d}" no es correcto para esta pregunta.`,
                contexto: preguntaOrigen ? preguntaOrigen.contextoCorrecta : null
            };
        })
    ];
    
    return opciones.sort(() => Math.random() - 0.5);
}

function mostrarPregunta() {
    if (preguntaActualIndex >= preguntasActuales.length) {
        mostrarResumenFinal();
        return;
    }
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const respuesta = respuestasUsuario[preguntaActualIndex];
    const opciones = generarOpciones(pregunta);
    respuesta.opcionesMostradas = opciones;
    
    const container = document.getElementById('preguntas-container');
    
    let html = `
        <div class="pregunta-card">
            <div class="pregunta-texto">${pregunta.texto}</div>
            <div class="opciones" id="opciones-container">
    `;
    
    opciones.forEach((opcion, idx) => {
        html += `
            <div class="opcion" onclick="seleccionarOpcion(${idx})">
                <input type="radio" name="pregunta" id="opcion_${idx}" value="${opcion.texto.replace(/"/g, '&quot;')}">
                <label for="opcion_${idx}">${opcion.texto}</label>
            </div>
        `;
    });
    
    html += `
            </div>
            <div id="feedback-${preguntaActualIndex}" class="feedback" style="display:none;"></div>
            <button class="boton-siguiente" id="btn-siguiente" onclick="siguientePregunta()" disabled>VERIFICAR</button>
        </div>
    `;
    
    container.innerHTML = html;
}

function seleccionarOpcion(indice) {
    document.getElementById('btn-siguiente').disabled = false;
    window.opcionSeleccionada = indice;
}

function siguientePregunta() {
    if (window.opcionSeleccionada === undefined) {
        return;
    }
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const respuesta = respuestasUsuario[preguntaActualIndex];
    const opcionSeleccionada = respuesta.opcionesMostradas[window.opcionSeleccionada];
    
    respuesta.intentos++;
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    
    if (opcionSeleccionada.esCorrecta) {
        respuesta.respondida = true;
        respuesta.respuestaFinal = opcionSeleccionada.texto;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-exito';
        feedbackDiv.innerHTML = `✅ Correcto. ${opcionSeleccionada.feedback}`;
        
        document.querySelectorAll('.opcion').forEach(el => {
            el.style.opacity = '0.6';
            el.style.pointerEvents = 'none';
        });
        
        const btn = document.getElementById('btn-siguiente');
        btn.textContent = 'SIGUIENTE →';
        btn.onclick = () => avanzarSiguientePregunta();
        
    } else {
        let mensajeFeedback = `${opcionSeleccionada.feedback}<br><br>`;
        
        if (opcionSeleccionada.contexto) {
            mensajeFeedback += `📚 <strong>¿Sabías que...?</strong><br>`;
            mensajeFeedback += `${opcionSeleccionada.contexto}.<br><br>`;
        }
        
        mensajeFeedback += `🔄 Intenta de nuevo con las opciones restantes.`;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-error';
        feedbackDiv.innerHTML = mensajeFeedback;
        
        document.getElementById('btn-siguiente').disabled = true;
        const opcionesDiv = document.querySelectorAll('.opcion');
        opcionesDiv[window.opcionSeleccionada].style.opacity = '0.5';
        opcionesDiv[window.opcionSeleccionada].style.pointerEvents = 'none';
        window.opcionSeleccionada = undefined;
    }
}

function avanzarSiguientePregunta() {
    preguntaActualIndex++;
    
    if (preguntaActualIndex < preguntasActuales.length) {
        mostrarPregunta();
        actualizarProgreso();
    } else {
        mostrarResumenFinal();
    }
}

function actualizarProgreso() {
    const progreso = document.getElementById('progreso-preguntas');
    if (progreso) {
        progreso.textContent = `Pregunta ${preguntaActualIndex + 1} de ${preguntasActuales.length}`;
    }
}

function mostrarResumenFinal() {
    const container = document.getElementById('preguntas-container');
    
    let aciertos = 0;
    let totalIntentos = 0;
    let aprendizajeCruzado = 0;
    
    let tablaHtml = `
        <h3>📋 RESUMEN DE LA ACTIVIDAD</h3>
        <table class="resumen-tabla">
            <thead>
                <tr><th>Pregunta</th><th>Tu respuesta</th><th>Intentos</th><th></th></tr>
            </thead>
            <tbody>
    `;
    
    preguntasActuales.forEach((pregunta, idx) => {
        const respuesta = respuestasUsuario[idx];
        const acertada = respuesta.respondida;
        if (acertada) aciertos++;
        totalIntentos += respuesta.intentos;
        if (respuesta.intentos > 1) aprendizajeCruzado++;
        
        const intentosClass = respuesta.intentos === 1 ? 'intento-1' : 'intento-multiple';
        const iconoAprendizaje = respuesta.intentos > 1 ? '📚' : '🔵';
        
        tablaHtml += `
            <tr>
                <td>${pregunta.texto.substring(0, 60)}...</td>
                <td>${respuesta.respuestaFinal || 'No respondida'}</td>
                <td class="${intentosClass}">${respuesta.intentos}</td>
                <td class="aprendizaje-icono">${iconoAprendizaje}</td>
            </tr>
        `;
    });
    
    tablaHtml += `
            </tbody>
        </table>
        <div class="estadisticas">
            <p>✅ Aciertos: ${aciertos} de ${preguntasActuales.length}</p>
            <p>📊 Promedio de intentos: ${(totalIntentos / preguntasActuales.length).toFixed(1)}</p>
            <p>🎓 Preguntas con aprendizaje cruzado: ${aprendizajeCruzado}</p>
            <button class="boton-reiniciar" onclick="inicializarPreguntas()">🔄 NUEVO EXAMEN</button>
            <button class="boton-reiniciar" onclick="irAPrincipalDesdePreguntas()">🏠 VOLVER AL MENÚ</button>
        </div>
    `;
    
    container.innerHTML = tablaHtml;
}

function irAPrincipalDesdePreguntas() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-biblioteca').classList.add('active');
    document.querySelector('.tab-button:first-child').classList.add('active');
    
    mostrarPantallaPrincipal();
}

// ============================================
// GLOSARIO MEJORADO (con JSON, buscador, letras, paginación)
// ============================================

let glosarioData = [];
let glosarioFiltrado = [];
let letraActual = 'TODAS';
let paginaActual = 1;
const TERMINOS_POR_PAGINA = 10;

async function mostrarGlosario() {
    try {
        const response = await fetch('datos/glosario.json');
        const data = await response.json();
        glosarioData = data.terminos;
        glosarioFiltrado = [...glosarioData];
        
        const container = document.getElementById('contenido-glosario');
        
        let html = `
            <div style="margin-bottom: 20px;">
                🔍 Buscar término
                <input type="text" id="buscadorGlosario" class="buscador" placeholder="Escriba el término (mínimo 3 letras)" style="width: 100%; padding: 12px;">
            </div>
            <div id="letrasContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; justify-content: center;">
                <button class="letra-btn active" data-letra="TODAS" onclick="filtrarPorLetra('TODAS')">TODAS</button>
        `;
        
        const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        letras.forEach(letra => {
            html += `<button class="letra-btn" data-letra="${letra}" onclick="filtrarPorLetra('${letra}')">${letra}</button>`;
        });
        
        html += `</div>`;
        html += `<div id="glosarioLista"></div>`;
        html += `<div id="paginacionContainer" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;"></div>`;
        
        container.innerHTML = html;
        
        const buscador = document.getElementById('buscadorGlosario');
        if (buscador) {
            buscador.addEventListener('input', function() {
                const texto = this.value.trim();
                if (texto.length >= 3 || texto.length === 0) {
                    ejecutarBusqueda();
                }
            });
        }
        
        actualizarListaGlosario();
        
    } catch (error) {
        console.error('Error cargando glosario:', error);
        document.getElementById('contenido-glosario').innerHTML = '<p style="color:red;">❌ Error al cargar el glosario. Verifica que el archivo datos/glosario.json exista.</p>';
    }
}

function ejecutarBusqueda() {
    const buscador = document.getElementById('buscadorGlosario');
    if (!buscador) return;
    
    const texto = buscador.value.trim().toLowerCase();
    
    if (texto.length >= 3) {
        glosarioFiltrado = glosarioData.filter(item => 
            item.termino.toLowerCase().includes(texto) || 
            item.definicion.toLowerCase().includes(texto)
        );
        letraActual = 'TODAS';
        paginaActual = 1;
        document.querySelectorAll('.letra-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-letra') === 'TODAS') {
                btn.classList.add('active');
            }
        });
    } else if (texto.length === 0) {
        glosarioFiltrado = [...glosarioData];
        letraActual = 'TODAS';
        paginaActual = 1;
        document.querySelectorAll('.letra-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-letra') === 'TODAS') {
                btn.classList.add('active');
            }
        });
    }
    actualizarListaGlosario();
}

function filtrarPorLetra(letra) {
    letraActual = letra;
    paginaActual = 1;
    
    const buscador = document.getElementById('buscadorGlosario');
    if (buscador) buscador.value = '';
    
    if (letra === 'TODAS') {
        glosarioFiltrado = [...glosarioData];
    } else {
        glosarioFiltrado = glosarioData.filter(item => 
            item.termino.charAt(0).toUpperCase() === letra
        );
    }
    
    document.querySelectorAll('.letra-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-letra') === letra) {
            btn.classList.add('active');
        }
    });
    
    actualizarListaGlosario();
}

function actualizarListaGlosario() {
    const startIndex = (paginaActual - 1) * TERMINOS_POR_PAGINA;
    const endIndex = startIndex + TERMINOS_POR_PAGINA;
    const paginados = glosarioFiltrado.slice(startIndex, endIndex);
    const totalPaginas = Math.ceil(glosarioFiltrado.length / TERMINOS_POR_PAGINA);
    
    let html = '<div class="glosario-lista">';
    
    if (paginados.length === 0) {
        html += '<p style="text-align: center; padding: 40px;">📭 No se encontraron términos.</p>';
    } else {
        paginados.forEach(item => {
            html += `
                <div class="glosario-item">
                    <div class="glosario-termino">${item.termino}</div>
                    <div class="glosario-definicion">${item.definicion}</div>
                </div>
            `;
        });
    }
    html += '</div>';
    
    document.getElementById('glosarioLista').innerHTML = html;
    
    let pagHtml = '';
    if (totalPaginas > 1) {
        pagHtml += `<button onclick="cambiarPagina(-1)" ${paginaActual === 1 ? 'disabled' : ''}>◀ Anterior</button>`;
        pagHtml += `<span style="margin: 0 15px;">Página ${paginaActual} de ${totalPaginas}</span>`;
        pagHtml += `<button onclick="cambiarPagina(1)" ${paginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ▶</button>`;
    }
    document.getElementById('paginacionContainer').innerHTML = pagHtml;
}

function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(glosarioFiltrado.length / TERMINOS_POR_PAGINA);
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        actualizarListaGlosario();
    }
}

// ============================================
// MENÚ HAMBURGUESA PARA MÓVILES
// ============================================
function initMenuHamburguesa() {
    const menuToggle = document.getElementById('menuToggle');
    const tabsContainer = document.getElementById('tabsContainer');
    
    if (menuToggle && tabsContainer) {
        menuToggle.addEventListener('click', function() {
            tabsContainer.classList.toggle('open');
        });
        
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    tabsContainer.classList.remove('open');
                }
            });
        });
    }
}

// ============================================
// FUNCIÓN PARA MOSTRAR ERRORES
// ============================================
function mostrarError(mensaje) {
    const container = document.getElementById('contenido-ley');
    if (container) {
        container.innerHTML = `<div class="feedback feedback-error" style="padding: 20px; text-align: center;">❌ ${mensaje}</div>`;
    } else {
        console.error(mensaje);
    }
}

// Efecto de sombra en header pegajoso
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 10) {
        header.classList.add('sticky-shadow');
    } else {
        header.classList.remove('sticky-shadow');
    }
});