// js/asistente/embeddings.js
// Versión OPTIMIZADA - Usa embeddings pre-calculados (soporta float16)
// Solo calcula embedding de la pregunta del usuario

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.7.0';

env.allowRemoteModels = true;

let faqs = [];
let modeloListo = false;
let colaDeEspera = [];
let queryModel = null;

// ============================================
// CONVERSIÓN float16 -> float32
// ============================================
function float16BitsToFloat32(bits) {
    let s = (bits >> 15) & 0x1;
    let e = (bits >> 10) & 0x1F;
    let m = bits & 0x3FF;
    
    if (e === 0) {
        if (m === 0) return s === 0 ? 0 : -0;
        let value = m / 1024.0;
        return s === 0 ? value * Math.pow(2, -14) : -value * Math.pow(2, -14);
    } else if (e === 0x1F) {
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
// LIMPIAR TEMA (eliminar ¿ y muletillas)
// ============================================
function limpiarTema(tema) {
    if (!tema) return tema;
    
    let limpio = tema.trim();
    
    // 1. Primero eliminar signos ¿ (para que las muletillas queden al inicio)
    limpio = limpio.replace(/¿/g, "");
    
    // 2. Eliminar muletillas comunes al inicio
    const muletillas = [
        "oye,", "oye ", "parce,", "parce ", "pana,", "pana ",
        "mi hermano,", "mi hermano ", "hermano ", "entonces,", "entonces ",
        "una duda,", "una duda ", "a ver,", "a ver ", "cuéntame,", "cuéntame ",
        "dime,", "dime ", "o sea,", "o sea ", "bueno,", "bueno ",
        "pues,", "pues ", "mira,", "mira ", "parcero,", "parcero "
    ];
    
    const minusculas = limpio.toLowerCase();
    for (const m of muletillas) {
        if (minusculas.startsWith(m)) {
            limpio = limpio.slice(m.length).trim();
            break;
        }
    }
    
    // Capitalizar primera letra
    if (limpio.length > 0) {
        limpio = limpio.charAt(0).toUpperCase() + limpio.slice(1);
    }
    
    return limpio;
}

// ============================================
// CARGAR EMBEDDINGS
// ============================================
async function cargarEmbeddings() {
    console.log('🔍 Cargando embeddings pre-calculados en segundo plano...');
    
    const response = await fetch('datos/faqs_embeddings.json');
    const data = await response.json();
    
    if (data.version === 'float16') {
        console.log('✅ Detectado formato float16, convirtiendo vectores...');
        faqs = data.embeddings.map(item => ({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            embedding: convertirEmbeddingF16aF32(item.embedding_f16)
        }));
    } else if (Array.isArray(data)) {
        console.log('✅ Detectado formato legacy (float32)');
        faqs = data.map(item => ({
            pregunta: item.pregunta,
            respuesta: item.respuesta,
            embedding: new Float32Array(item.embedding)
        }));
    } else {
        throw new Error('Formato de embeddings no reconocido');
    }
    
    modeloListo = true;
    console.log(`✅ ${faqs.length} FAQs cargadas (${data.version === 'float16' ? 'float16 convertido' : 'float32'})`);
    
    colaDeEspera.forEach(cb => cb());
    colaDeEspera = [];
}

// ============================================
// CARGAR MODELO MINILM
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
    
    if (similitudMax >= UMBRAL_CONFIANZA_ALTA) {
        console.log(`✅ Respuesta directa: "${mejor.faq.respuesta}"`);
        return {
            respuesta: mejor.faq.respuesta,
            necesitaConfirmacion: false,
            tema: limpiarTema(mejor.faq.pregunta),
            similitud: similitudMax
        };
    }
    
    if (similitudMax >= UMBRAL_INCERTIDUMBRE && similitudMax < UMBRAL_CONFIANZA_ALTA) {
        console.log(`⚠️ Zona gris (${similitudMax.toFixed(3)}). Preguntando confirmación sobre: "${mejor.faq.pregunta}"`);
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: limpiarTema(mejor.faq.pregunta),
            respuestaCorrecta: mejor.faq.respuesta,
            similitud: similitudMax
        };
    }
    
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