// ============================================
// GENERADOR - Generar opciones de respuesta
// ============================================

export function generarOpciones(pregunta) {
    const correcta = pregunta.respuestaCorrecta;
    const explicacionCorrecta = pregunta.explicacionCorrecta || pregunta.explicacion || "Respuesta correcta";
    const distractores = pregunta.distractores || [];
    
    const opciones = [
        { texto: correcta, esCorrecta: true, feedback: explicacionCorrecta }
    ];
    
    // Si los distractores son objetos (nuevo formato)
    if (distractores.length > 0 && typeof distractores[0] === 'object') {
        distractores.forEach(d => {
            opciones.push({
                texto: d.texto,
                esCorrecta: false,
                feedback: d.explicacion || `❌ Incorrecto. "${d.texto}" no es la respuesta correcta.`
            });
        });
    } else {
        // Formato antiguo (array de strings) - compatibilidad
        distractores.forEach(d => {
            opciones.push({
                texto: d,
                esCorrecta: false,
                feedback: `❌ Incorrecto. "${d}" no es la respuesta correcta.`
            });
        });
    }
    
    return opciones.sort(() => Math.random() - 0.5);
}