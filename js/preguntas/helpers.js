// ============================================
// HELPERS - Funciones de utilidad
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario
} from '../estado.js';

import { inicializarPreguntas } from './examen.js';
import { mostrarInicioPreguntas } from './inicio.js';

export function hayExamenEnCurso() {
    return preguntasActuales.length > 0 && preguntaActualIndex < preguntasActuales.length;
}

export function iniciarExamenDesdeSelect() {
    const modoSeleccionado = window.modoSeleccionado || 'estudio';
    
    if (modoSeleccionado === 'simulacro') {
        // Simulacro: no necesita selectores
        inicializarPreguntas('simulacro');
    } else {
        // Modo estudio: usar el select de subcategoría
        const subcategoriaSelect = document.getElementById('subcategoria-competencia');
        if (subcategoriaSelect && subcategoriaSelect.value) {
            inicializarPreguntas(subcategoriaSelect.value);
        }
    }
}

export function diagnosticarRespuestas() {
    console.log('===== DIAGNÓSTICO DE RESPUESTAS =====');
    console.log('Total preguntas:', preguntasActuales.length);
    console.log('Respuestas guardadas:', respuestasUsuario);
    
    for (let idx = 0; idx < preguntasActuales.length; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        
        console.log(`\n--- Pregunta ${idx + 1} ---`);
        console.log('Texto:', pregunta.texto);
        console.log('Respuesta del usuario:', respuesta.respuestaFinal);
        console.log('Intentos:', respuesta.intentos);
        
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            console.log('Opción correcta:', opcionCorrecta ? opcionCorrecta.texto : 'NO ENCONTRADA');
            
            const esCorrecta = (respuesta.respuestaFinal === opcionCorrecta?.texto);
            console.log('¿Es correcta?', esCorrecta ? '✅ SI' : '❌ NO');
        } else {
            console.log('opcionesMostradas: NO EXISTE');
        }
    }
    console.log('===== FIN DIAGNÓSTICO =====');
}

// Exponer funciones globales para onclick
window.iniciarExamenDesdeSelect = iniciarExamenDesdeSelect;
window.mostrarInicioPreguntas = mostrarInicioPreguntas;
window.diagnosticarRespuestas = diagnosticarRespuestas;