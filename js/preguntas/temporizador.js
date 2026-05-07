// ============================================
// TEMPORIZADOR - Gestión del tiempo en simulacro
// ============================================

import { 
    preguntasActuales, respuestasUsuario,
    modoSimulacro, setTemporizadorActivo,
    tiempoTotalRestante, setTiempoTotalRestante, tiempoTotalConfigurado
} from '../estado.js';

import { getIntervaloGlobal, setIntervaloGlobal } from './globales.js';
import { mostrarResumenFinal } from './resumen.js';

export function iniciarTemporizadorGlobal() {
    if (!modoSimulacro) {
        return;
    }
    
    let intervaloGlobal = getIntervaloGlobal();
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
    }
    
    
    intervaloGlobal = setInterval(() => {
        if (!modoSimulacro) return;
        
        const tiempoActual = tiempoTotalRestante;
        if (tiempoActual <= 1) {
            // Tiempo total agotado
            clearInterval(intervaloGlobal);
            setIntervaloGlobal(null);
            setTemporizadorActivo(false);
            
            // Marcar todas las preguntas no respondidas como incorrectas
            for (let i = 0; i < preguntasActuales.length; i++) {
                const resp = respuestasUsuario[i];
                if (!resp.respondida) {
                    resp.respondida = true;
                    resp.respuestaFinal = 'Tiempo agotado';
                    resp.esCorrecta = false;
                }
            }
            
            // Mostrar resumen final
            mostrarResumenFinal();
        } else {
            const nuevoTiempo = tiempoActual - 1;
            setTiempoTotalRestante(nuevoTiempo);
            actualizarTemporizadorGlobalVisual();
        }
    }, 1000);
    
    setIntervaloGlobal(intervaloGlobal);
}

export function detenerTemporizadorGlobal() {
    let intervaloGlobal = getIntervaloGlobal();
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        setIntervaloGlobal(null);
    }
    setTemporizadorActivo(false);
}

export function actualizarTemporizadorGlobalVisual() {
    const tiempoElement = document.getElementById('temporizador-simulacro');
    const barraElement = document.getElementById('barra-tiempo');
    if (!tiempoElement) return;
    
    const segundos = Math.max(0, tiempoTotalRestante);
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    const tiempoTexto = `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    
    tiempoElement.textContent = tiempoTexto;
    
    const porcentaje = (segundos / tiempoTotalConfigurado) * 100;
    if (barraElement) {
        barraElement.style.width = `${porcentaje}%`;
        
        if (porcentaje < 20) {
            barraElement.style.backgroundColor = '#dc3545';
            tiempoElement.style.color = '#dc3545';
        } else if (porcentaje < 50) {
            barraElement.style.backgroundColor = '#ffc107';
            tiempoElement.style.color = '#ffc107';
        } else {
            barraElement.style.backgroundColor = '#0d6efd';
            tiempoElement.style.color = '#0d6efd';
        }
    }
}

// ✅ NO repetir export { actualizarTemporizadorGlobalVisual };