// js/asistente/embeddings.js
// Versión OPTIMIZADA - Usa embeddings pre-calculados (soporta float16)
// Solo calcula embedding de la pregunta del usuario

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.7.0';

env.allowRemoteModels = true;

let faqs = [];          // Array de objetos con pregunta, respuesta, embedding (Float32Array)
let modeloListo = false;
let colaDeEspera = [];
let queryModel = null;

// ============================================
// CONVERSIÓN float16 (bits) -> float32
// ============================================
function float16BitsToFloat32(bits) {
    let s = (bits >> 15) & 0x1;
    let e = (bits >> 10) & 0x1F;
    let m = bits & 0x3FF;
    
    if (e === 0) {
        // denormal or zero
        if (m === 0) return s === 0 ? 0 : -0;
        let value = m / 1024.0;
        return s === 0 ? value * Math.pow(2, -14) : -value * Math.pow(2, -14);
    } else if (e === 0x1F) {
        // NaN or Inf
        if (m === 0) return s === 0 ? Infinity : -Infinity;
        return NaN;
    } else {
        let exponent = e - 15;
        let mantissa = m / 1024.0;
        let value = (1 + mantissa) * Math.pow(2, exponent);
        return s === 0 ? value : -value;
    }
}

function convertirEmbeddingF16aF32(uint16Array) {
    const float32 = new Float32Array(uint16Array.length);
    for (let i = 0; i < uint16Array.length; i++) {
        float32[i] = float16BitsToFloat32(uint16Array[i]);
    }
    return float32;
}

// ============================================
// POPUP DE CARGA
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
// CARGAR EMBEDDINGS PRE-CALCULADOS (soporta float16 y legacy)
// ============================================
async function cargarEmbeddings() {
    mostrarPopupCarga();
    actualizarPopup('Cargando base de conocimiento...', 0);
    
    console.log('🔍 Cargando embeddings pre-calculados...');
    
    let progreso = 0;
    const interval = setInterval(() => {
        if (progreso < 90) {
            progreso += 15;
            actualizarPopup('Cargando base de conocimiento...', progreso);
        }
    }, 100);
    
    const response = await fetch('datos/faqs_embeddings.json?t=' + Date.now());
    const data = await response.json();
    
    clearInterval(interval);
    
    // Detectar formato
    if (data.version === 'float16') {
        // Nuevo formato: { version: "float16", embeddings: [ { pregunta, respuesta, embedding_f16 } ] }
        console.log('✅ Detectado formato float16, convirtiendo vectores...');
        faqs = data.embeddings.map(item => ({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            embedding: convertirEmbeddingF16aF32(item.embedding_f16)
        }));
    } else if (Array.isArray(data)) {
        // Formato legacy: array directo con embedding en float32
        console.log('✅ Detectado formato legacy (float32)');
        faqs = data.map(item => ({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            embedding: new Float32Array(item.embedding)   // asegurar Float32Array
        }));
    } else {
        throw new Error('Formato de embeddings no reconocido');
    }
    
    modeloListo = true;
    
    actualizarPopup('Asistente listo', 100);
    console.log(`✅ ${faqs.length} FAQs cargadas (${data.version === 'float16' ? 'float16 convertido' : 'float32'})`);
    
    colaDeEspera.forEach(cb => cb());
    colaDeEspera = [];
    
    setTimeout(ocultarPopupCarga, 1000);
}

// ============================================
// CARGAR MODELO PARA PREGUNTAS (solo una vez)
// ============================================
async function getQueryModel() {
    if (!queryModel) {
        console.log('🔄 Cargando modelo para preguntas...');
        queryModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Modelo de preguntas listo');
    }
    return queryModel;
}

// ============================================
// SIMILITUD DE COSENO (optimizada con Float32Array)
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
// BUSCAR RESPUESTA (con desambiguación)
// ============================================
export async function buscarRespuestaTFIDF(preguntaUsuario) {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    
    if (faqs.length === 0) return { respuesta: null, necesitaConfirmacion: false };
    
    const pipe = await getQueryModel();
    const queryEmbedding = await pipe(preguntaUsuario, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmbedding.data);
    
    const resultados = [];
    for (const faq of faqs) {
        const similitud = similitudCoseno(queryVector, faq.embedding);
        resultados.push({ faq, similitud });
    }
    resultados.sort((a, b) => b.similitud - a.similitud);
    
    const mejor = resultados[0];
    const similitudMax = mejor?.similitud || 0;
    const UMBRAL_CONFIANZA_ALTA = 0.85;
    const UMBRAL_INCERTIDUMBRE = 0.65;
    
    console.log(`🎯 Mejor similitud: ${similitudMax.toFixed(3)}`);
    
    // Caso 1: confianza alta → responder directamente
    if (similitudMax >= UMBRAL_CONFIANZA_ALTA) {
        console.log(`✅ Respuesta directa: "${mejor.faq.respuesta}"`);
        return {
            respuesta: mejor.faq.respuesta,
            necesitaConfirmacion: false,
            tema: mejor.faq.pregunta,
            similitud: similitudMax
        };
    }
    
    // Caso 2: zona de incertidumbre → preguntar al usuario
    if (similitudMax >= UMBRAL_INCERTIDUMBRE && similitudMax < UMBRAL_CONFIANZA_ALTA) {
        console.log(`⚠️ Zona gris (${similitudMax.toFixed(3)}). Preguntando confirmación sobre: "${mejor.faq.pregunta}"`);
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: mejor.faq.pregunta,
            respuestaCorrecta: mejor.faq.respuesta,
            similitud: similitudMax
        };
    }
    
    // Caso 3: similitud muy baja
    console.log(`❌ Sin respuesta clara (máx: ${similitudMax.toFixed(3)})`);
    return {
        respuesta: "No estoy seguro de haber entendido tu pregunta. ¿Podrías ser más específico?",
        necesitaConfirmacion: false,
        tema: null,
        similitud: similitudMax
    };
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
export async function cargarFAQsVectorizadas() {
    await cargarEmbeddings();
    return true;
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