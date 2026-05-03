// ============================================
// MÓDULO: leyes.js
// Carga y visualización de leyes
// ============================================

import { leyesDisponibles, leyActual, setLeyActual } from './estado.js';
import { mostrarPantallaPrincipal } from './biblioteca.js';
import { mostrarArticulo, filtrarArticulos, inicializarListaArticulos } from './articulos.js';
import { mostrarError } from './utils.js';

export async function cargarLey(leyId) {
    try {
        const ley = leyesDisponibles.find(l => l.id === leyId);
        const response = await fetch(`datos/leyes/${ley.id}.json`);
        const data = await response.json();
        setLeyActual(data);
        mostrarVistaLey();
    } catch (error) {
        console.error('Error cargando ley:', error);
        mostrarError('Error al cargar la ley seleccionada.');
    }
}

export function mostrarVistaLey() {
    const contenido = document.getElementById('contenido-ley');
    const ley = leyActual;

    let html = `<button class="boton-volver" onclick="mostrarPantallaPrincipal()">← VOLVER A LAS NORMAS</button>`;
    html += `<h2>${ley.nombre}</h2>`;
    html += `<p><strong>${ley.tituloCompleto}</strong></p>`;
    html += `<p><em>Fecha: ${ley.fecha} | Estado: ${ley.estado}</em></p>`;

    html += `<h3>📖 Resumen</h3>`;
    html += `<p>${ley.resumen}</p>`;

    // Buscador con fondo azul
    html += `
        <div style="background: var(--azul); padding: 16px; border-radius: 12px; margin: 20px 0;">
            <label for="buscadorArticulo" style="color: white; font-weight: bold; font-size: 1rem; display: block; margin-bottom: 8px;">🔍 Buscar artículo</label>
            <input type="text" id="buscadorArticulo" class="buscador" placeholder="Número de artículo o palabra clave (ej: 153, 157, EPS)..." onkeyup="filtrarArticulos(this.value)" style="width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 1rem; background: white; color: #212529;">
        </div>
    `;

    // Lista de artículos relevantes
    html += `<div id="listaArticulos" class="indice"></div>`;

    // Texto completo directamente visible
    if (ley.textoCompleto && ley.textoCompleto.trim() !== '') {
        html += `<div style="margin-top:20px; white-space:pre-wrap; line-height:1.6;">${ley.textoCompleto.replace(/\n/g, '<br>')}</div>`;
    }

    // Botón Subir
    html += `
    <button id="btn-subir-ley" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑</button>
    `;

    contenido.innerHTML = html;

    // Forzar scroll al inicio al cargar una nueva ley
    window.scrollTo({top: 0, behavior: 'instant'});

    setTimeout(() => {
        const btnSubir = document.getElementById('btn-subir-ley');
        if (btnSubir) {
            btnSubir.style.display = 'none';
            window.addEventListener('scroll', function () {
                if (window.scrollY > 300) {
                    btnSubir.style.display = 'block';
                } else {
                    btnSubir.style.display = 'none';
                }
            });
        }
    }, 100);

    // Inicializar la lista de artículos
    inicializarListaArticulos(ley.articulos || ley.articulosDestacados || []);
}