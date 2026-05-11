// js/asistente/tfidf.js
// Algoritmo TF-IDF + similitud de coseno + ranking contextual

let faqs = [];        // [{ pregunta, respuesta, vector }]

// 1. Normalizar texto (minúsculas, sin acentos, sin puntuación)
function normalizar(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[¿?¡!.,;:()]/g, '')
        .trim();
}

// 2. Tokenizar (dividir en palabras)
function tokenizar(texto) {
    return normalizar(texto).split(/\s+/).filter(p => p.length > 2);
}

// 3. Calcular TF (Term Frequency) para un documento
function calcularTF(tokens) {
    const tf = {};
    for (const token of tokens) {
        tf[token] = (tf[token] || 0) + 1;
    }
    for (const token in tf) {
        tf[token] = tf[token] / tokens.length;
    }
    return tf;
}

// 4. Calcular IDF (Inverse Document Frequency)
function calcularIDF(todosLosTokens) {
    const idf = {};
    const totalDocs = todosLosTokens.length;
    for (const tokens of todosLosTokens) {
        const unicos = new Set(tokens);
        for (const token of unicos) {
            idf[token] = (idf[token] || 0) + 1;
        }
    }
    for (const token in idf) {
        idf[token] = Math.log(totalDocs / idf[token]);
    }
    return idf;
}

// 5. Calcular vector TF-IDF para un documento
function calcularVectorTFIDF(tf, idf) {
    const vector = {};
    for (const token in tf) {
        vector[token] = tf[token] * (idf[token] || 0);
    }
    return vector;
}

// 6. Calcular similitud de coseno entre dos vectores
function similitudCoseno(vecA, vecB) {
    let productoPunto = 0;
    let normaA = 0;
    let normaB = 0;
    
    for (const token in vecA) {
        productoPunto += vecA[token] * (vecB[token] || 0);
        normaA += vecA[token] * vecA[token];
    }
    for (const token in vecB) {
        normaB += vecB[token] * vecB[token];
    }
    
    if (normaA === 0 || normaB === 0) return 0;
    return productoPunto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

// 7. Análisis contextual para desempatar
function seleccionarPorContexto(candidatos, preguntaUsuario) {
    const categorias = {
        'tiempo': ['tiempo', 'acabó', 'acabo', 'segundos', 'minutos', 'reloj', 'cronómetro', 'alcancé', 'responder'],
        'offline': ['señal', 'internet', 'campo', 'sin red', 'offline', 'conexión', 'sin señal'],
        'pin': ['pin', 'pagar', 'costo', 'dinero', '$', 'valor', 'toca pagar'],
        'progreso': ['bien', 'mal', 'voy', 'sabiendo', 'progreso', 'avance', 'yendo bien'],
        'luna': ['lunita', 'luna', 'oscuro', 'noche', 'modo oscuro', 'lunita'],
        'cambiar': ['cambiar', 'marcó', 'marqué', 'corregir', 'equivocó', 'equivocado', 'opción', 'borrar'],
        'cuadritos': ['cuadritos', 'verde', 'rojo', 'iconos', 'resultados', 'cuadro', 'colores'],
        'flecha': ['flecha', 'flechita', 'subir', 'abajo', 'derecha', 'botón subir', 'aparece abajo'],
        'cerrar': ['cerrar', 'navegador', 'página', 'pierde', 'pierdo', 'guardado', 'cierro', 'error']
    };
    
    for (const candidato of candidatos) {
        let puntajeContexto = 0;
        const respuesta = candidato.faq.respuesta.toLowerCase();
        
        for (const [categoria, palabras] of Object.entries(categorias)) {
            for (const palabra of palabras) {
                if (preguntaUsuario.toLowerCase().includes(palabra)) {
                    for (const p of palabras) {
                        if (respuesta.includes(p)) {
                            puntajeContexto += 10;
                        }
                    }
                }
            }
        }
        candidato.puntajeContexto = puntajeContexto;
    }
    
    candidatos.sort((a, b) => b.puntajeContexto - a.puntajeContexto);
    
    if (candidatos[0].puntajeContexto > (candidatos[1]?.puntajeContexto || 0)) {
        return candidatos[0].faq.respuesta;
    }
    
    return candidatos[0].faq.respuesta;
}

// 8. Cargar FAQs desde archivo
export async function cargarFAQs() {
    try {
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
        
        const todosLosTokens = [];
        for (const faq of preguntasRespuestas) {
            const tokens = tokenizar(faq.pregunta);
            todosLosTokens.push(tokens);
            faq.tokens = tokens;
        }
        
        const idf = calcularIDF(todosLosTokens);
        
        for (const faq of preguntasRespuestas) {
            const tf = calcularTF(faq.tokens);
            faq.vector = calcularVectorTFIDF(tf, idf);
        }
        
        faqs = preguntasRespuestas;
        console.log(`✅ ${faqs.length} FAQs cargadas y vectorizadas`);
        return faqs;
        
    } catch (error) {
        console.error('Error cargando FAQs:', error);
        return [];
    }
}

// 9. Buscar respuesta con ranking contextual
export function buscarRespuestaTFIDF(preguntaUsuario, topN = 3) {
    if (faqs.length === 0) return null;
    
    const tokensUsuario = tokenizar(preguntaUsuario);
    const tfUsuario = calcularTF(tokensUsuario);
    
    const todosLosTokens = faqs.map(f => f.tokens);
    const idf = calcularIDF(todosLosTokens);
    const vectorUsuario = calcularVectorTFIDF(tfUsuario, idf);
    
    const resultados = [];
    for (const faq of faqs) {
        const similitud = similitudCoseno(vectorUsuario, faq.vector);
        resultados.push({ faq, similitud });
    }
    
    resultados.sort((a, b) => b.similitud - a.similitud);
    
    const UMBRAL = 0.30;
    const candidatos = resultados.filter(r => r.similitud >= UMBRAL);
     
    if (candidatos.length === 0) return null;
    
    const topCandidatos = candidatos.slice(0, topN);
    
    if (topCandidatos.length === 1) {
        return topCandidatos[0].faq.respuesta;
    }
    
    return seleccionarPorContexto(topCandidatos, preguntaUsuario);
}