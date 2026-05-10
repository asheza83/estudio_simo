// js/asistente/embeddings.js
// Motor semántico con MiniLM (Transformers.js)
// Con pantalla de carga con progreso real

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.7.0';

env.allowRemoteModels = true;

let pipe = null;
let faqs = [];
let modeloListo = false;
let colaDeEspera = [];

// ============================================
// POPUP DE CARGA (pantalla completa)
// ============================================
function mostrarPopupCarga() {
    const overlay = document.getElementById('loader-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.style.pointerEvents = 'none';
    }
}

function actualizarPopup(texto, porcentaje) {
    const mensaje = document.getElementById('loader-mensaje');
    const barra = document.getElementById('loader-progress-bar');
    const porcentajeSpan = document.getElementById('loader-porcentaje');
    
    if (mensaje) mensaje.textContent = texto;
    if (barra) barra.style.width = `${porcentaje}%`;
    if (porcentajeSpan) porcentajeSpan.textContent = `${porcentaje}%`;
    
    console.log(`📊 ${texto} ${porcentaje}%`);
}

function ocultarPopupCarga() {
    const overlay = document.getElementById('loader-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.opacity = '1';
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
        }, 500);
    }
}

// ============================================
// MOSTRAR MENSAJE EN CHAT (respaldo)
// ============================================
function mostrarCargaEnChat() {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    if (body.children.length === 0 || !body.querySelector('.mensaje-carga-modelo')) {
        const div = document.createElement('div');
        div.className = 'mensaje mensaje-bot mensaje-carga-modelo';
        div.innerHTML = '🤖 <strong>Iniciando asistente inteligente...</strong><br><small>La primera vez tarda unos segundos descargando el modelo (~70MB). Las siguientes será más rápido.</small>';
        body.appendChild(div);
    }
}

// ============================================
// CARGAR FAQs DESDE faqs.txt
// ============================================
async function cargarFAQs() {
    console.log('🔍 Iniciando carga de faqs.txt...');
    
    const response = await fetch('datos/faqs.txt?t=' + Date.now());
    console.log(`📡 fetch completado, status: ${response.status}`);
    
    const texto = await response.text();
    console.log(`📄 Tamaño del archivo: ${texto.length} caracteres`);
    console.log(`📄 Primeros 200 caracteres: ${texto.substring(0, 200)}...`);
    console.log(`📄 Últimos 200 caracteres: ${texto.substring(texto.length - 200)}...`);
    
    const lineas = texto.split('\n');
    console.log(`📄 Total líneas en el archivo: ${lineas.length}`);
    
    const preguntasRespuestas = [];
    let lineasProcesadas = 0;
    
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (linea === '') continue;
        
        if (linea === 'fraseExperto' || linea.startsWith('fraseExperto:')) {
            console.log(`⏹️ Fin de archivo en línea ${i + 1}`);
            break;
        }
        
        if (linea.endsWith('?')) {
            const pregunta = linea;
            let respuesta = '';
            let j = i + 1;
            while (j < lineas.length && lineas[j].trim() !== '' && !lineas[j].trim().endsWith('?')) {
                respuesta += lineas[j].trim() + ' ';
                j++;
            }
            preguntasRespuestas.push({ pregunta, respuesta: respuesta.trim() });
            lineasProcesadas++;
            i = j - 1;
            
            if (lineasProcesadas % 50 === 0) {
                console.log(`   ✅ Procesadas ${lineasProcesadas} preguntas...`);
            }
        }
    }
    
    console.log(`📚 TOTAL: ${preguntasRespuestas.length} FAQs cargadas`);
    return preguntasRespuestas;
}

// ============================================
// INICIALIZAR MODELO Y VECTORIZAR
// ============================================
async function initModelo() {
    if (pipe !== null) return pipe;
    
    mostrarPopupCarga();
    actualizarPopup('Descargando modelo MiniLM...', 0);
    console.log('🔄 Cargando modelo MiniLM... (~70MB)');
    
    // Simular progreso inicial mientras descarga
    let progresoSimulado = 0;
    const interval = setInterval(() => {
        if (progresoSimulado < 25) {
            progresoSimulado += 5;
            actualizarPopup('Descargando modelo MiniLM...', progresoSimulado);
        }
    }, 300);
    
    pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    clearInterval(interval);
    
    actualizarPopup('Modelo cargado, leyendo FAQs...', 30);
    console.log('✅ Modelo MiniLM cargado');
    
    const faqsRaw = await cargarFAQs();
    const totalFAQs = faqsRaw.length;
    console.log(`📋 FAQs crudas recibidas: ${totalFAQs}`);
    
    actualizarPopup('Vectorizando preguntas...', 30);
    faqs = [];
    
    for (let i = 0; i < faqsRaw.length; i++) {
        const item = faqsRaw[i];
        const embedding = await pipe(item.pregunta, { pooling: 'mean', normalize: true });
        faqs.push({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            vector: Array.from(embedding.data)
        });
        
        // Actualizar progreso cada 30 preguntas
        if (i % 30 === 0 || i === totalFAQs - 1) {
            const porcentaje = 30 + Math.floor((i / totalFAQs) * 65);
            actualizarPopup(`Vectorizando (${i + 1}/${totalFAQs})...`, porcentaje);
        }
        
        // Pequeña pausa para no bloquear la UI
        if ((i + 1) % 50 === 0) {
            await new Promise(r => setTimeout(r, 10));
        }
    }
    
    modeloListo = true;
    actualizarPopup('Asistente listo', 100);
    console.log(`✅ ${faqs.length} FAQs vectorizadas. Asistente listo.`);
    
    // Ejecutar preguntas pendientes
    colaDeEspera.forEach(cb => cb());
    colaDeEspera = [];
    
    // Ocultar popup después de 1 segundo
    setTimeout(ocultarPopupCarga, 1000);
    
    return pipe;
}

// ============================================
// SIMILITUD DE COSENO
// ============================================
function similitudCoseno(vecA, vecB) {
    let productoPunto = 0;
    let normaA = 0;
    let normaB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        productoPunto += vecA[i] * vecB[i];
        normaA += vecA[i] * vecA[i];
        normaB += vecB[i] * vecB[i];
    }
    
    if (normaA === 0 || normaB === 0) return 0;
    return productoPunto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

// ============================================
// BUSCAR RESPUESTA
// ============================================
export async function buscarRespuestaTFIDF(preguntaUsuario) {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    
    if (faqs.length === 0) return null;
    
    const queryEmbedding = await pipe(preguntaUsuario, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmbedding.data);
    
    const resultados = [];
    for (const faq of faqs) {
        const similitud = similitudCoseno(queryVector, faq.vector);
        resultados.push({ faq, similitud });
    }
    
    resultados.sort((a, b) => b.similitud - a.similitud);
    
    const UMBRAL = 0.55;
    
    if (resultados.length > 0 && resultados[0].similitud >= UMBRAL) {
        console.log(`🎯 Similitud: ${resultados[0].similitud.toFixed(3)} - "${resultados[0].faq.pregunta.substring(0, 50)}..."`);
        return resultados[0].faq.respuesta;
    }
    
    console.log(`❌ No encontró respuesta (máx: ${resultados[0]?.similitud.toFixed(3) || 0})`);
    return null;
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
export async function cargarFAQsVectorizadas() {
    return await initModelo();
}

export async function obtenerFAQsLista() {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    return faqs.map(f => ({ pregunta: f.pregunta, respuesta: f.respuesta }));
}