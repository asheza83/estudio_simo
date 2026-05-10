// ============================================
// DATOS - Carga del conocimiento (FAQs + MiniLM)
// ============================================

import { cargarFAQsVectorizadas, obtenerFAQsLista } from './embeddings.js';
import { setMensajeBienvenida } from './respuestas.js';

export async function cargarConocimiento() {
    try {
        // Iniciar MiniLM explícitamente (solo una vez)
        await cargarFAQsVectorizadas();
        
        const faqsLista = await obtenerFAQsLista();
        
        if (faqsLista && faqsLista.length > 0) {
            const bienvenidaFAQ = faqsLista.find(f => f.pregunta.includes('¿Qué es ESTUDIO SIMO?'));
            if (bienvenidaFAQ) {
                setMensajeBienvenida(bienvenidaFAQ.respuesta);
            }
        }
        
        console.log(`✅ Asistente IA: ${faqsLista?.length || 0} FAQs cargadas con MiniLM`);
        return true;
    } catch (error) {
        console.error('❌ Error cargando conocimiento con MiniLM:', error);
        return false;
    }
}

export function getConocimientoData() {
    return null;
}