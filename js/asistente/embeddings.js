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
// INDICADOR DE CARGA
// ============================================
function mostrarProgreso(texto, porcentaje = null) {
    let div = document.getElementById('asistente-carga');
    if (!div) return;
    
    div.style.display = 'block';
    div.textContent = `🤖 ${texto}`;
    if (porcentaje !== null) {
        div.textContent += ` ${porcentaje}%`;
    }
    
    console.log(`📊 Progreso: ${texto} ${porcentaje ? porcentaje + '%' : ''}`);
}

function ocultarProgreso() {
    const div = document.getElementById('asistente-carga');
    if (div) {
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => {
                div.style.display = 'none';
                div.style.opacity = '1';
            }, 500);
        }, 1000);
    }
}

// ============================================
// 1. MOSTRAR INDICADOR DE CARGA
// ============================================
function mostrarCargaEnChat() {
    const body = document.getElementById('asistente-body');
    if (!body) return;
    
    // Verificar si ya hay mensaje de carga
    if (body.children.length === 0 || !body.querySelector('.mensaje-carga-modelo')) {
        const div = document.createElement('div');
        div.className = 'mensaje mensaje-bot mensaje-carga-modelo';
        div.innerHTML = '🤖 <strong>Iniciando asistente inteligente...</strong><br><small>La primera vez tarda unos segundos descargando el modelo (~70MB). Las siguientes será más rápido.</small>';
        body.appendChild(div);
    }
}

// ============================================
// 2. CARGAR FAQs DESDE faqs.txt
// ============================================
async function cargarFAQs() {
    console.log('🔍 Iniciando carga de faqs.txt...');
    
    // Forzar recarga sin caché
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
                // Detectar fraseExperto y mostrar línea exacta CON EL CONTENIDO
        if (linea === 'fraseExperto' || linea.startsWith('fraseExperto:')) {
            console.log(`⏹️ Posible fin de archivo en línea ${i + 1}`);
            console.log(`   Contenido sospechoso: "${linea}"`);
            console.log(`   Total FAQs cargadas hasta ahora: ${preguntasRespuestas.length}`);
            
            // Si la línea es EXACTAMENTE "fraseExperto" o empieza con "fraseExperto:", detener
            if (linea === 'fraseExperto' || linea.startsWith('fraseExperto:')) {
                console.log(`   ✅ Confirmado: es fraseExperto. Deteniendo.`);
                break;
            }
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
            
            // Log cada 50 preguntas
            if (lineasProcesadas % 50 === 0) {
                console.log(`   ✅ Procesadas ${lineasProcesadas} preguntas... Última: "${pregunta.substring(0, 40)}..."`);
            }
        }
    }
    
    console.log(`📚 TOTAL: ${preguntasRespuestas.length} FAQs cargadas desde faqs.txt`);
    if (preguntasRespuestas.length > 0) {
        console.log(`🔍 Primera pregunta: "${preguntasRespuestas[0].pregunta}"`);
        console.log(`🔍 Última pregunta: "${preguntasRespuestas[preguntasRespuestas.length-1].pregunta}"`);
    }
    
    return preguntasRespuestas;
}

// ============================================
// 3. INICIALIZAR MODELO Y VECTORIZAR
// ============================================
async function initModelo() {
    if (pipe !== null) return pipe;
    
    mostrarProgreso('Descargando modelo MiniLM...', 0);
    console.log('🔄 Cargando modelo MiniLM... (~70MB)');
    
    // Simular progreso de descarga (porque pipeline no da progreso real)
    let progreso = 0;
    const interval = setInterval(() => {
        if (progreso < 90) {
            progreso += 10;
            mostrarProgreso('Descargando modelo MiniLM...', progreso);
        }
    }, 500);
    
    pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    clearInterval(interval);
    
    mostrarProgreso('Modelo cargado, leyendo FAQs...', 30);
    console.log('✅ Modelo MiniLM cargado, vectorizando FAQs...');
    
    const faqsRaw = await cargarFAQs();
    const totalFAQs = faqsRaw.length;
    console.log(`📋 FAQs crudas recibidas: ${totalFAQs}`);
    
    mostrarProgreso('Vectorizando preguntas...', 30);
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
            const porcentaje = 30 + Math.floor((i / totalFAQs) * 60);
            mostrarProgreso(`Vectorizando (${i + 1}/${totalFAQs})...`, porcentaje);
        }
    }
    
    modeloListo = true;
    mostrarProgreso('Asistente listo', 100);
    console.log(`✅ ${faqs.length} FAQs vectorizadas. Asistente listo.`);
    
    // Ejecutar preguntas pendientes
    colaDeEspera.forEach(cb => cb());
    colaDeEspera = [];
    
    // Ocultar después de 2 segundos
    setTimeout(ocultarProgreso, 2000);
    
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