// ============================================
// DATOS - Carga con progreso simulado (pesos reales: 24 MB + 70 MB)
// ============================================

import { cargarFAQsVectorizadas, obtenerFAQsLista, inicializarModeloConProgreso } from './embeddings.js';

let modeloListo = false;
let suscriptoresProgreso = [];
let cargaCompletada = false;
let progresoSimulado = 0;

function notificarProgreso(porcentaje) {
    progresoSimulado = porcentaje;
    suscriptoresProgreso.forEach(cb => cb(porcentaje));
}

export function suscribirProgreso(callback) {
    suscriptoresProgreso.push(callback);
}

export function isModeloListo() {
    return modeloListo;
}

export async function cargarConocimiento() {
    try {
        // Los embeddings son ~24 MB (25.5% del total 94 MB)
        // Simulamos progreso de 0% a 25% mientras se cargan los embeddings
        let progresoEmb = 0;
        const intervaloEmb = setInterval(() => {
            if (progresoEmb < 80) {
                progresoEmb += 1;  // +1% cada 400ms → ~10 segundos para llegar a 24%
                notificarProgreso(progresoEmb);
            }
        }, 550);
        
        // Iniciamos la carga real de embeddings (24 MB)
        await cargarFAQsVectorizadas();
        
        clearInterval(intervaloEmb);
        notificarProgreso(25);   // Base 25% después de embeddings
        
        // El modelo es ~70 MB (74.5% del total)
        // Simulamos progreso de 25% a 98% mientras se carga el modelo
        let progresoMod = 25;
        const intervaloMod = setInterval(() => {
            if (progresoMod < 98) {
                progresoMod += 0.6;  // +0.6% cada 400ms → ~49 segundos para llegar a 98%
                notificarProgreso(Math.floor(progresoMod));
            }
        }, 400);
        
        // Carga real del modelo (70 MB)
        await inicializarModeloConProgreso();
        
        clearInterval(intervaloMod);
        modeloListo = true;
        notificarProgreso(100);
        
        const faqsLista = await obtenerFAQsLista();
        console.log(`✅ Asistente IA: ${faqsLista?.length || 0} FAQs cargadas con MiniLM`);
        return true;
    } catch (error) {
        console.error('❌ Error cargando conocimiento:', error);
        notificarProgreso(100);
        return false;
    }
}

export function getConocimientoData() {
    return null;
}