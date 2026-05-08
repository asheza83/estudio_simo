// ============================================
// EXAMEN - Inicializar, comenzar nuevo, continuar
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario,
    modoSimulacro, setModoSimulacro, setTemporizadorActivo,
    setTiempoTotalRestante, setTiempoTotalConfigurado
} from '../estado.js';

import { ocultarContenidoDescriptivo, restaurarContenidoDescriptivo } from './ui.js';
import { setFiltroLeyActual, getFiltroLeyActual, setExamenGuardado, getExamenGuardado, mostrarInicioPreguntas } from './inicio.js';
import { setTiempoInicioSimulacro, setTiempoUsadoSegundos } from './resumen.js';
import { mostrarPregunta, actualizarProgreso } from './visual.js';
import { rutasArchivos } from './config.js';

let filtroLeyActual = getFiltroLeyActual();
let examenGuardado = getExamenGuardado();

async function cargarPreguntasDesdeArchivo(archivoId) {
    const ruta = rutasArchivos[archivoId];
    if (!ruta) return null;
    
    try {
        const response = await fetch(`datos/preguntas/${ruta}`);
        const data = await response.json();
        return data.preguntas || [];
    } catch (error) {
        console.error(`Error cargando preguntas de ${archivoId}:`, error);
        return null;
    }
}

export async function inicializarPreguntas(archivoId = null) {
    const modoSeleccionado = window.modoSeleccionado || 'estudio';
    
    // ========================================
    // SIMULACRO: no usa selectores, carga simulacro.json
    // ========================================
    if (modoSeleccionado === 'simulacro') {
        archivoId = 'simulacro';
    } 
    // ========================================
    // MODO ESTUDIO: usa el select de subcategoría
    // ========================================
    else {
        if (!archivoId) {
            const subcategoriaSelect = document.getElementById('subcategoria-competencia');
            archivoId = subcategoriaSelect ? subcategoriaSelect.value : null;
        }
    }
    
    if (!archivoId) return;

    // Guardar el modo seleccionado (Estudio o Simulacro)
    setModoSimulacro(modoSeleccionado === 'simulacro');
    
    // Obtener la configuración según el modo
    const cantidadPreguntas = window.variablesEvaluacion?.preguntas || 0;
    const tiempoTotal = window.variablesEvaluacion?.tiempoTotal;
    
    console.log("📊 DEBUG examen.js:");
    console.log("  - modoSeleccionado:", modoSeleccionado);
    console.log("  - archivoId:", archivoId);
    console.log("  - window.variablesEvaluacion:", window.variablesEvaluacion);
    console.log("  - cantidadPreguntas a usar:", cantidadPreguntas);
    
    // Configurar tiempo total si es modo simulacro
    if (modoSimulacro) {
        setTiempoInicioSimulacro(Date.now());
        setTiempoUsadoSegundos(null);
        
        if (tiempoTotal) {
            setTiempoTotalRestante(tiempoTotal);
            setTiempoTotalConfigurado(tiempoTotal);
            console.log(`⏱️ Simulacro: ${cantidadPreguntas} preguntas - Tiempo total: ${tiempoTotal / 60} minutos`);
        }
    }
    
    setFiltroLeyActual(archivoId);
    setExamenGuardado(null);
    
    // Cargar preguntas desde el archivo correspondiente
    const preguntas = await cargarPreguntasDesdeArchivo(archivoId);
    
    if (!preguntas || preguntas.length === 0) {
        document.getElementById('preguntas-container').innerHTML = '<p>❌ No hay preguntas disponibles para esta subcategoría.</p>';
        return;
    }
    
    // Ocultar contenido descriptivo
    ocultarContenidoDescriptivo();
    
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    if (inicio) inicio.style.display = 'none';
    if (examen) examen.style.display = 'block';
    
    // Usar cantidadPreguntas para el slice (si no hay suficientes, usar todas)
    const preguntasMezcladas = [...preguntas].sort(() => Math.random() - 0.5);
    const limite = Math.min(cantidadPreguntas, preguntasMezcladas.length);
    const nuevasPreguntas = preguntasMezcladas.slice(0, limite);
    
    setPreguntasActuales(nuevasPreguntas);
    setPreguntaActualIndex(0);
    setRespuestasUsuario(nuevasPreguntas.map(() => ({
        intentos: 0,
        respondida: false,
        respuestaFinal: null,
        opcionesMostradas: null,
        esCorrecta: false
    })));
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    mostrarPregunta();
    actualizarProgreso();

    console.log("  - nuevasPreguntas.length:", nuevasPreguntas?.length);
}

export function comenzarNuevoExamen() {
    setTemporizadorActivo(false);
    setExamenGuardado(null);
    setPreguntasActuales([]);
    setPreguntaActualIndex(0);
    setRespuestasUsuario([]);
    setFiltroLeyActual('');
    
    restaurarContenidoDescriptivo();
    mostrarInicioPreguntas();
}

export function continuarExamen() {
    const examenGuardado = getExamenGuardado();
    if (!examenGuardado) {
        mostrarInicioPreguntas();
        return;
    }
    
    setFiltroLeyActual(examenGuardado.leyId);
    
    ocultarContenidoDescriptivo();
    
    const inicio = document.getElementById('preguntas-inicio');
    const examen = document.getElementById('preguntas-examen');
    if (inicio) inicio.style.display = 'none';
    if (examen) examen.style.display = 'block';
    
    setPreguntasActuales(examenGuardado.preguntas);
    setPreguntaActualIndex(examenGuardado.preguntaIndex);
    setRespuestasUsuario(examenGuardado.respuestas);
    setExamenGuardado(null);
    
    mostrarPregunta();
    actualizarProgreso();
}

window.inicializarPreguntas = inicializarPreguntas;
window.comenzarNuevoExamen = comenzarNuevoExamen;
window.continuarExamen = continuarExamen;