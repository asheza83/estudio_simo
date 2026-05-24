// js/asistente/embeddings.js
// Versión OPTIMIZADA - Usa embeddings pre-calculados (soporta float16)
// Siempre carga y fusiona el archivo grande (base) y el pequeño (parche)

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

async function calcularSimilitud(textoA, textoB) {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    const pipe = await getQueryModel();
    const embA = await pipe(textoA, { pooling: 'mean', normalize: true });
    const embB = await pipe(textoB, { pooling: 'mean', normalize: true });
    const vecA = Array.from(embA.data);
    const vecB = Array.from(embB.data);
    return similitudCoseno(vecA, vecB);
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
    
    // 1. Eliminar signos ¿
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
// CARGAR EMBEDDINGS (fusiona grande + pequeño)
// ============================================
async function cargarEmbeddings() {
    console.log('🔍 Cargando embeddings pre-calculados en segundo plano...');
    
    let todosLosFaqs = [];
    
    // Función auxiliar para cargar un archivo y devolver sus FAQs
    async function cargarArchivo(archivo, nombre) {
        try {
            const response = await fetch(archivo);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.version === 'float16') {
                const items = data.embeddings.map(item => ({
                    pregunta: item.pregunta,
                    respuesta: item.respuesta,
                    embedding: convertirEmbeddingF16aF32(item.embedding_f16)
                }));
                console.log(`✅ ${nombre}: ${items.length} preguntas`);
                return items;
            } else if (Array.isArray(data)) {
                const items = data.map(item => ({
                    pregunta: item.pregunta,
                    respuesta: item.respuesta,
                    embedding: new Float32Array(item.embedding)
                }));
                console.log(`✅ ${nombre}: ${items.length} preguntas`);
                return items;
            } else {
                console.warn(`⚠️ Formato no reconocido en ${archivo}`);
                return null;
            }
        } catch (e) {
            console.warn(`⚠️ No se pudo cargar ${nombre} (${archivo}):`, e.message);
            return null;
        }
    }
    
    // Cargar archivo grande (base)
    const grande = await cargarArchivo('datos/faqs_embeddings.json', 'Base (grande)');
    if (grande) todosLosFaqs.push(...grande);
    
    // Cargar archivo pequeño (parche)
    const pequeno = await cargarArchivo('datos/faqs_dev_embeddings.json', 'Parche (pequeño)');
    if (pequeno) {
        todosLosFaqs.push(...pequeno);
        console.log(`➕ Fusionado: ${grande?.length || 0} (base) + ${pequeno.length} (parche) = ${todosLosFaqs.length} total`);
    } else {
        console.log(`📦 Solo base: ${grande?.length || 0} preguntas`);
    }
    
    if (todosLosFaqs.length === 0) {
        throw new Error('No se pudo cargar ningún archivo de FAQs');
    }
    
    faqs = todosLosFaqs;
    
    if (faqs.length > 0) {
        console.log('📌 Ejemplo de primer FAQ:', {
            tienePregunta: !!faqs[0].pregunta,
            pregunta: faqs[0].pregunta,
            respuesta: faqs[0].respuesta?.substring(0, 50)
        });
    }
    
    modeloListo = true;
    console.log(`✅ ${faqs.length} FAQs cargadas en total`);
    
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
async function buscarRespuestaTFIDF(preguntaUsuario) {
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
            similitud: similitudMax,
            pregunta: mejor.faq.pregunta
        };
    }
    
    if (similitudMax >= UMBRAL_INCERTIDUMBRE && similitudMax < UMBRAL_CONFIANZA_ALTA) {
        console.log(`⚠️ Zona gris (${similitudMax.toFixed(3)}). Preguntando confirmación sobre: "${mejor.faq.pregunta}"`);
        return {
            respuesta: null,
            necesitaConfirmacion: true,
            tema: limpiarTema(mejor.faq.pregunta),
            respuestaCorrecta: mejor.faq.respuesta,
            similitud: similitudMax,
            pregunta: mejor.faq.pregunta
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
// GLOSARIO SEMÁNTICO (usando embeddings)
// ============================================
let glosarioEmbeddings = null;
let glosarioLista = null;

async function cargarGlosarioEmbeddings() {
    if (glosarioEmbeddings) return;
    try {
        const response = await fetch('datos/glosario_embeddings.json');
        const data = await response.json();
        if (data.version === 'float16') {
            glosarioLista = data.embeddings.map(item => ({
                pregunta: item.pregunta,
                respuesta: item.respuesta,
                embedding: convertirEmbeddingF16aF32(item.embedding_f16)
            }));
        } else if (Array.isArray(data)) {
            glosarioLista = data.map(item => ({
                pregunta: item.pregunta,
                respuesta: item.respuesta,
                embedding: new Float32Array(item.embedding)
            }));
        } else {
            throw new Error('Formato de embeddings de glosario no reconocido');
        }
        console.log(`✅ Glosario semántico cargado: ${glosarioLista.length} términos`);
    } catch (error) {
        console.error('Error cargando glosario embeddings:', error);
        glosarioLista = [];
    }
}

async function buscarEnGlosarioSemantico(preguntaUsuario) {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    if (!glosarioLista) {
        await cargarGlosarioEmbeddings();
    }
    if (!glosarioLista || glosarioLista.length === 0) {
        return null;
    }

    const pipe = await getQueryModel();
    const queryEmbedding = await pipe(preguntaUsuario, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(queryEmbedding.data);

    let mejorSimilitud = 0;
    let mejorItem = null;

    for (const item of glosarioLista) {
        const sim = similitudCoseno(queryVector, item.embedding);
        if (sim > mejorSimilitud) {
            mejorSimilitud = sim;
            mejorItem = item;
        }
    }

    const UMBRAL_GLOSARIO = 0.85;
    if (mejorSimilitud >= UMBRAL_GLOSARIO) {
        console.log(`📖 Glosario semántico: "${mejorItem.pregunta}" (sim: ${mejorSimilitud.toFixed(3)})`);
        return {
            respuesta: mejorItem.respuesta,
            similitud: mejorSimilitud
        };
    }
    return null;
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
async function cargarFAQsVectorizadas() {
    await cargarEmbeddings();
    return true;
}

async function obtenerFAQsLista() {
    if (!modeloListo) {
        await new Promise((resolve) => {
            if (modeloListo) resolve();
            else colaDeEspera.push(resolve);
        });
    }
    return faqs.map(f => ({ pregunta: f.pregunta, respuesta: f.respuesta }));
}

export { buscarRespuestaTFIDF, cargarFAQsVectorizadas, obtenerFAQsLista, buscarEnGlosarioSemantico, calcularSimilitud };