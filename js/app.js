// ============================================
// MÓDULO: app.js (Orquestador)
// Importa, inicializa y expone funciones globales
// ============================================

import { setLeyesDisponibles, setPreguntasBanco } from './estado.js';
import { cargarModoOscuro, cargarTamañoLetra, initConfiguracion } from './ajustes.js';
import { cambiarPestana, irAPreguntas } from './navegacion.js';
import { mostrarPantallaPrincipal, irAPrincipalDesdePreguntas } from './biblioteca.js';
import { mostrarGlosario, filtrarPorLetra, cambiarPagina } from './glosario.js';
import { cargarLey } from './leyes.js';
import { mostrarArticulo, buscarArticuloPorNumero, buscarArticulo, cerrarModal, filtrarArticulos } from './articulos.js';
import { mostrarError } from './utils.js';
import { inicializarPreguntas, seleccionarOpcion, siguientePregunta, verificarRespuesta, mostrarInicioPreguntas, preguntarGuardarExamen, verificarExamenGuardado, guardarExamen, descartarExamen, comenzarNuevoExamen, continuarExamen, iniciarExamenDesdeSelect } from './preguntas.js';
// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
window.cargarLey = cargarLey;
window.mostrarPantallaPrincipal = mostrarPantallaPrincipal;
window.mostrarGlosario = mostrarGlosario;
window.inicializarPreguntas = inicializarPreguntas;
window.mostrarArticulo = mostrarArticulo;
window.buscarArticuloPorNumero = buscarArticuloPorNumero;
window.buscarArticulo = buscarArticulo;
window.cerrarModal = cerrarModal;
window.irAPreguntas = irAPreguntas;
window.cambiarPestana = cambiarPestana;
window.filtrarPorLetra = filtrarPorLetra;
window.cambiarPagina = cambiarPagina;
window.irAPrincipalDesdePreguntas = irAPrincipalDesdePreguntas;
window.seleccionarOpcion = seleccionarOpcion;
window.filtrarArticulos = filtrarArticulos;  // ← Agrega esta línea
window.siguientePregunta = siguientePregunta;
window.verificarRespuesta = verificarRespuesta;

window.mostrarInicioPreguntas = mostrarInicioPreguntas;
window.preguntarGuardarExamen = preguntarGuardarExamen;
window.verificarExamenGuardado = verificarExamenGuardado;
window.guardarExamen = guardarExamen;
window.descartarExamen = descartarExamen;
window.comenzarNuevoExamen = comenzarNuevoExamen;
window.continuarExamen = continuarExamen;

window.iniciarExamenDesdeSelect = iniciarExamenDesdeSelect;


// ... el resto del código queda igual

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function cargarDatosIniciales() {
    try {
        const responseIndex = await fetch('index.json');
        const dataIndex = await responseIndex.json();
        setLeyesDisponibles(dataIndex.leyes);
        
        // Cargar preguntas de todas las leyes disponibles
        let todasLasPreguntas = [];
        for (const ley of dataIndex.leyes) {
            try {
                const response = await fetch(`datos/preguntas/${ley.id}.json`);
                const data = await response.json();
                todasLasPreguntas = todasLasPreguntas.concat(data.preguntas);
            } catch (e) {
                console.warn(`No se encontraron preguntas para ${ley.id}`);
            }
        }
        setPreguntasBanco(todasLasPreguntas);
    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarError('Error al cargar los datos. Asegúrate de que todos los archivos existan.');
    }
}

function inicializarEventos() {
    // Eventos ya se inicializan en initConfiguracion
}

// Efecto de sombra en header pegajoso
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 10) {
        header.classList.add('sticky-shadow');
    } else {
        header.classList.remove('sticky-shadow');
    }
});

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    inicializarEventos();
    cargarModoOscuro();
    cargarTamañoLetra();
    initConfiguracion();
    mostrarPantallaPrincipal();
    mostrarInicioPreguntas();
});