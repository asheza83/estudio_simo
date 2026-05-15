// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { procesarOpcionNumerica } from './numerico.js';
import { buscarRespuestaTFIDF } from './embeddings.js';

let funcionalidadesCache = null;

async function cargarFuncionalidades() {
    if (!funcionalidadesCache) {
        try {
            const response = await fetch('datos/funcionalidades.json');
            funcionalidadesCache = await response.json();
        } catch (error) {
            console.warn('No se pudo cargar funcionalidades.json', error);
            funcionalidadesCache = { 
                funcionalidades_no_disponibles: { listado: [] },
                funcionalidades_por_seccion: {}
            };
        }
    }
    return funcionalidadesCache;
}

function buscarEnFuncionalidadesDisponibles(pregunta, funcionalidades) {
    const secciones = funcionalidades?.funcionalidades_por_seccion || {};
    const preguntaLower = pregunta.toLowerCase();
    
    // Recorrer todas las funcionalidades disponibles
    for (const seccion in secciones) {
        const contenido = secciones[seccion];
        
        // Buscar en cada subsección
        for (const key in contenido) {
            const item = contenido[key];
            if (typeof item === 'object' && item.disponible === true) {
                const nombreFuncion = key.replace(/_/g, ' ');
                if (preguntaLower.includes(nombreFuncion.toLowerCase())) {
                    return true; // La funcionalidad SÍ existe
                }
                if (item.descripcion && preguntaLower.includes(item.descripcion.toLowerCase().substring(0, 30))) {
                    return true;
                }
            }
        }
        
        // Buscar en la descripción de la sección
        if (contenido.descripcion && preguntaLower.includes(contenido.descripcion.toLowerCase().substring(0, 30))) {
            return true;
        }
    }
    return false;
}

function esPreguntaDeFuncionalidadNoDisponible(pregunta, funcionalidades) {
    // Primero, verificar si la funcionalidad SÍ existe
    if (buscarEnFuncionalidadesDisponibles(pregunta, funcionalidades)) {
        return false; // Existe, no es "no disponible"
    }
    
    const listaNoDisponibles = funcionalidades?.funcionalidades_no_disponibles?.listado || [];
    const indicadores = [
        'puedo', 'se puede', 'cómo hago para', 'hay forma de', 'existe',
        'permite', 'deja', 'puede', 'manera de', 'opción de', 'función de',
        'se puede hacer', 'es posible'
    ];
    
    const preguntaLower = pregunta.toLowerCase();
    const esPreguntaDeAccion = indicadores.some(ind => preguntaLower.includes(ind));
    
    if (!esPreguntaDeAccion) return false;
    
    for (const noDisp of listaNoDisponibles) {
        const keywords = noDisp.toLowerCase().split(' ');
        for (const kw of keywords) {
            if (kw.length > 4 && preguntaLower.includes(kw)) {
                return true;
            }
        }
    }
    return false;
}

function respuestaFuncionalidadNoDisponible() {
    return "Lo siento, esa funcionalidad no está disponible en ESTUDIO SIMO. La herramienta está diseñada para ayudarte a prepararte para el concurso de la CNSC: estudiar la convocatoria, consultar las normas del sector salud, practicar con exámenes tipo SIMO (Modo Estudio y Modo Simulacro) y buscar términos en el Glosario. ¿Te ayudo con algún tema del concurso?";
}

export async function buscarRespuesta(pregunta) {
    // 1. Procesar opciones numéricas (ej. "1", "2", "sí", "no")
    const respuestaNumerica = procesarOpcionNumerica(pregunta.trim());
    if (respuestaNumerica) return { respuesta: respuestaNumerica, necesitaConfirmacion: false };
    
    // 2. Cargar funcionalidades (solo una vez)
    const funcionalidades = await cargarFuncionalidades();
    
    // 3. Si la pregunta es sobre una funcionalidad NO disponible, responder directamente
    if (esPreguntaDeFuncionalidadNoDisponible(pregunta, funcionalidades)) {
        return { respuesta: respuestaFuncionalidadNoDisponible(), necesitaConfirmacion: false };
    }
    
    // 4. Si no, buscar con MiniLM/embeddings
    return await buscarRespuestaTFIDF(pregunta);
}