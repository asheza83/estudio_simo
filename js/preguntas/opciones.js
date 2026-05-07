// ============================================
// OPCIONES - Seleccionar opción y verificar respuesta
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario,
    setPreguntaActualIndex, setRespuestasUsuario,
    modoSimulacro, setTemporizadorActivo
} from '../estado.js';

import { getIntervaloGlobal, setIntervaloGlobal } from './globales.js';

export function seleccionarOpcion(indice) {
    const respuesta = respuestasUsuario[preguntaActualIndex];
    if (respuesta.respondida) return;
    
    const opcionSeleccionada = respuesta.opcionesMostradas[indice];
    
    window.opcionSeleccionada = indice;
    
    if (modoSimulacro) {
        // Simulacro: guardar respuesta inmediatamente
        respuesta.respondida = true;
        respuesta.respuestaFinal = opcionSeleccionada.texto;
        respuesta.esCorrecta = opcionSeleccionada.esCorrecta;
        respuesta.intentos = 1;
        
        // ⚠️ NO detener el temporizador global aquí
        // El temporizador debe seguir corriendo mientras el usuario está en el examen
        // Solo se detiene cuando se acaba el tiempo o se termina el examen
        
        // Habilitar el botón SIGUIENTE
        document.getElementById('btn-siguiente').disabled = false;
        document.getElementById('btn-siguiente').style.display = 'block';
    } else {
        // Modo Estudio: solo seleccionar, sin guardar aún
        document.getElementById('btn-siguiente').disabled = false;
        document.getElementById('btn-siguiente').style.display = 'block';
    }
    
    // Ocultar feedback
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    if (feedbackDiv) {
        feedbackDiv.style.display = 'none';
    }
    
    setTimeout(() => {
        const btn = document.getElementById('btn-siguiente');
        if (btn && window.innerWidth <= 768) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 50);
}

export function siguientePregunta() {
    // Este flujo solo se usa en Modo Estudio
    if (modoSimulacro) return;
    
    const respuesta = respuestasUsuario[preguntaActualIndex];
    if (respuesta.respondida) return;
    if (window.opcionSeleccionada === undefined) return;
    
    const pregunta = preguntasActuales[preguntaActualIndex];
    const opcionSeleccionada = respuesta.opcionesMostradas[window.opcionSeleccionada];
    
    respuesta.intentos++;
    const feedbackDiv = document.getElementById(`feedback-${preguntaActualIndex}`);
    
    if (opcionSeleccionada.esCorrecta) {
        respuesta.respondida = true;
        respuesta.respuestaFinal = opcionSeleccionada.texto;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-exito';
        feedbackDiv.innerHTML = `✅ Correcto. ${opcionSeleccionada.feedback}`;
        
        document.querySelectorAll('.opcion').forEach(el => {
            el.style.opacity = '0.6';
            el.style.pointerEvents = 'none';
        });
        
        const btn = document.getElementById('btn-siguiente');
        btn.textContent = 'SIGUIENTE →';
        btn.onclick = () => window.avanzarSiguientePregunta();
        
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
        
    } else {
        let mensajeFeedback = `${opcionSeleccionada.feedback}<br><br>🔄 Intenta de nuevo con las opciones restantes.`;
        
        feedbackDiv.style.display = 'block';
        feedbackDiv.className = 'feedback feedback-error';
        feedbackDiv.innerHTML = mensajeFeedback;
        
        document.getElementById('btn-siguiente').disabled = true;
        const opcionesDiv = document.querySelectorAll('.opcion');
        opcionesDiv[window.opcionSeleccionada].style.opacity = '0.5';
        opcionesDiv[window.opcionSeleccionada].style.pointerEvents = 'none';
        window.opcionSeleccionada = undefined;
        
        setTimeout(() => {
            const btn = document.getElementById('btn-siguiente');
            if (btn && window.innerWidth <= 768) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    }
}