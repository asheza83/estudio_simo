// ============================================
// DATOS - Carga del conocimiento (FAQs + TF-IDF)
// ============================================

import { cargarFAQs } from './tfidf.js';
import { setMensajeBienvenida } from './respuestas.js';

export async function cargarConocimiento() {
    try {
        // Cargar FAQs desde faqs.txt y vectorizar
        const faqs = await cargarFAQs();
        
        // Establecer mensaje de bienvenida (lo tomamos de la primera FAQ si existe)
        if (faqs && faqs.length > 0) {
            // Buscar una pregunta de bienvenida o usar la primera
            const bienvenidaFAQ = faqs.find(f => f.pregunta.includes('¿Qué es ESTUDIO SIMO?'));
            if (bienvenidaFAQ) {
                setMensajeBienvenida(bienvenidaFAQ.respuesta);
            }
        }
        
        console.log(`✅ Asistente IA: ${faqs.length} FAQs cargadas y vectorizadas`);
        return true;
    } catch (error) {
        console.error('❌ Error cargando conocimiento:', error);
        return false;
    }
}

// Mantener compatibilidad con código existente que espera getConocimientoData
export function getConocimientoData() {
    // Ya no se usa el JSON anidado, devolvemos null o un objeto vacío
    return null;
}