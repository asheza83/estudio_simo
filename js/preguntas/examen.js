// ============================================
// EXAMEN - Inicializar, comenzar nuevo, continuar
// ============================================

import { 
    preguntasActuales, preguntaActualIndex, respuestasUsuario,
    setPreguntasActuales, setPreguntaActualIndex, setRespuestasUsuario,
    modoSimulacro, setModoSimulacro, setTemporizadorActivo,
    setTiempoTotalRestante, setTiempoTotalConfigurado,
    PREGUNTAS_POR_SESION
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
    if (!archivoId) {
        const subcategoriaSelect = document.getElementById('subcategoria-competencia');
        archivoId = subcategoriaSelect ? subcategoriaSelect.value : null;
    }
    
    if (!archivoId) return;

    // Guardar el modo seleccionado (Estudio o Simulacro)
    const modoSeleccionado = window.modoSeleccionado || 'estudio';
    setModoSimulacro(modoSeleccionado === 'simulacro');

    // Configurar tiempo total si es modo simulacro
    if (modoSimulacro) {
        setTiempoInicioSimulacro(Date.now());
        setTiempoUsadoSegundos(null);

        // Calcular tiempo total: 60 segundos por pregunta
        const tiempoTotal = PREGUNTAS_POR_SESION * 60;
        setTiempoTotalRestante(tiempoTotal);
        setTiempoTotalConfigurado(tiempoTotal);
        console.log(`⏱️ Simulacro: ${PREGUNTAS_POR_SESION} preguntas - Tiempo total: ${tiempoTotal / 60} minutos`);
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
    
    const preguntasMezcladas = [...preguntas].sort(() => Math.random() - 0.5);
    const nuevasPreguntas = preguntasMezcladas.slice(0, PREGUNTAS_POR_SESION);
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
}

export function comenzarNuevoExamen() {
    // Limpiar temporizador
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

// Exponer funciones globales para onclick
window.inicializarPreguntas = inicializarPreguntas;
window.comenzarNuevoExamen = comenzarNuevoExamen;
window.continuarExamen = continuarExamen;