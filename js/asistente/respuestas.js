// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './embeddings.js';

export async function buscarRespuesta(pregunta) {
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false };
    
    return await buscarRespuestaTFIDF(pregunta);
}