// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './embeddings.js';

export async function buscarRespuesta(pregunta) {
    // 1. Opciones numéricas (1-6)
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return respuestaNumerica;
    
    // 2. Delegar TODO al motor semántico (MiniLM)
    const respuesta = await buscarRespuestaTFIDF(pregunta);
    
    if (respuesta) {
        return respuesta;
    }
    
    // 3. No se encontró respuesta
    return "No estoy seguro de haber entendido tu pregunta. ¿Podrías ser más específico?";
}