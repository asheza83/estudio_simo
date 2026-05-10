// js/asistente/embeddings.js
// Motor semántico con MiniLM (Transformers.js)
// Reemplaza a TF-IDF cuando se activa

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.7.0';

env.allowRemoteModels = true;

let pipe = null;
let faqs = [];           // [{ pregunta, respuesta, vector }]
let modeloListo = false;
let colaDeEspera = [];

// ============================================
// 1. MOSTRAR INDICADOR DE CARGA
// ============================================
function mostrarCargaEnChat() {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    // Solo mostrar si el chat está vacío
    if (body.children.length === 0) {
        const div = document.createElement('div');
        div.className = 'mensaje mensaje-bot';
        div.textContent = '🤖 Iniciando asistente inteligente... (solo la primera vez tarda unos segundos)';
        body.appendChild(div);
    }
}

// ============================================
// 2. CARGAR FAQs DESDE faqs.txt
// ============================================
async function cargarFAQs() {
    const response = await fetch('datos/faqs.txt');
    const texto = await response.text();
    const lineas = texto.split('\n');
    
    const preguntasRespuestas = [];
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (linea === '' || linea.startsWith('fraseExperto')) continue;
        if (linea.endsWith('?')) {
            const pregunta = linea;
            let respuesta = '';
            let j = i + 1;
            while (j < lineas.length && lineas[j].trim() !== '' && !lineas[j].trim().endsWith('?')) {
                respuesta += lineas[j].trim() + ' ';
                j++;
            }
            preguntasRespuestas.push({ pregunta, respuesta: respuesta.trim() });
            i = j - 1;
        }
    }
    
    console.log(`📚 ${preguntasRespuestas.length} FAQs cargadas desde faqs.txt`);
    return preguntasRespuestas;
}

// ============================================
// 3. INICIALIZAR MODELO Y VECTORIZAR
// ============================================
async function initModelo() {
    if (pipe !== null) return pipe;
    
    console.log('🔄 Cargando modelo MiniLM... (~70MB)');
    mostrarCargaEnChat();
    
    pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log('✅ Modelo MiniLM cargado, vectorizando FAQs...');
    
    const faqsRaw = await cargarFAQs();
    faqs = [];
    
    for (const item of faqsRaw) {
        const embedding = await pipe(item.pregunta, { pooling: 'mean', normalize: true });
        faqs.push({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            vector: Array.from(embedding.data)
        });
    }
    
    modeloListo = true;
    console.log(`✅ ${faqs.length} FAQs vectorizadas. Asistente listo.`);
    
    // Ejecutar preguntas pendientes
    colaDeEspera.forEach(cb => cb());
    colaDeEspera = [];
    
    return pipe;
}

// ============================================
// 4. SIMILITUD DE COSENO
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
// 5. BUSCAR RESPUESTA (misma interfaz que buscarRespuestaTFIDF)
// ============================================
export async function buscarRespuestaTFIDF(preguntaUsuario) {
    // Esperar a que el modelo esté listo
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    
    if (faqs.length === 0) return null;
    
    // Generar embedding de la pregunta del usuario
    const queryEmbedding = await pipe(preguntaUsuario, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmbedding.data);
    
    // Calcular similitud con cada FAQ
    const resultados = [];
    for (const faq of faqs) {
        const similitud = similitudCoseno(queryVector, faq.vector);
        resultados.push({ faq, similitud });
    }
    
    // Ordenar por similitud (mayor a menor)
    resultados.sort((a, b) => b.similitud - a.similitud);
    
    const UMBRAL = 0.55;
    
    if (resultados.length > 0 && resultados[0].similitud >= UMBRAL) {
        console.log(`🎯 [MiniLM] Similitud: ${resultados[0].similitud.toFixed(3)} - "${resultados[0].faq.pregunta.substring(0, 50)}..."`);
        return resultados[0].faq.respuesta;
    }
    
    console.log(`❌ [MiniLM] No encontró respuesta (máx: ${resultados[0]?.similitud.toFixed(3) || 0})`);
    return null;
}

// ============================================
// 6. EXPORTAR FUNCIÓN DE CARGA PARA INICIALIZACIÓN
// ============================================
export async function cargarFAQsVectorizadas() {
    return await initModelo();
}


// ============================================
// 7. OBTENER LISTA DE FAQs (para datos.js)
// ============================================
export async function obtenerFAQsLista() {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    return faqs.map(f => ({ pregunta: f.pregunta, respuesta: f.respuesta }));
}

// Iniciar carga en segundo plano al importar este módulo
//initModelo().catch(console.error);