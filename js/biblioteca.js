// ============================================
// MÓDULO: biblioteca.js
// Menú principal de la biblioteca + buscador universal
// ============================================

import { leyesDisponibles } from './estado.js';
import { cargarLey } from './leyes.js';

export function mostrarPantallaPrincipal() {
    const contenido = document.getElementById('contenido-ley');
    
    let html = `
        <div style="background: var(--azul); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <label for="buscadorUniversal" style="color: white; font-weight: bold; font-size: 1rem; display: block; margin-bottom: 8px;">🔍 Buscar en todas las leyes (presiona Enter para buscar)</label>
            <input type="text" id="buscadorUniversal" class="buscador" placeholder="Escribe un término, sigla o palabra clave" onkeypress="if(event.key==='Enter') buscarEnLeyes(this.value)" style="width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 1rem; background: white; color: #212529;">
        </div>
    `;
    
    const grupos = {
        ley: { titulo: '📌 Normatividad en Salud', leyes: [] },
        decreto: { titulo: '📌 Decretos', leyes: [] },
        resolucion: { titulo: '📌 Resoluciones', leyes: [] }
    };
    
    leyesDisponibles.forEach(ley => {
        if (grupos[ley.tipo]) {
            grupos[ley.tipo].leyes.push(ley); 
        }
    });
    
    html += `
    <p style="color: var(--texto-secundario); margin-bottom: 8px; font-size: 1.3rem;">Selecciona una norma para ver su resumen, artículos relevantes y texto completo:</p>    
    <div style="background: rgba(13, 110, 253, 0.05); border-left: 3px solid var(--azul); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 1.3rem; color: var(--texto-secundario);">
        📌 <strong>Nota:</strong> Los artículos que se muestran en cada norma son los de mayor relevancia para la profesión de enfermería y para las pruebas SIMO. Otros artículos de la ley que cubren áreas administrativas o de otras profesiones no se incluyen en este resumen.
    </div>
`;    
    html += '<div class="leyes-menu" id="menu-leyes">';
    
    for (const [tipo, grupo] of Object.entries(grupos)) {
        if (grupo.leyes.length > 0) {
            html += `<div class="grupo-leyes">`;
            html += `<div class="grupo-titulo">${grupo.titulo}</div>`;
            grupo.leyes.forEach(ley => {
            html += `<button class="boton-ley" style="display: block; font-size: 1.3rem;" onclick="cargarLey('${ley.id}')">
                📄 ${ley.nombre}
                <span style="display: block; font-size: 1.1rem; font-weight: normal; margin-top: 5px;">
                    📊 Total: ${ley.totalArticulos || '?'} artículos <br/>🩺 Relevantes (enfermería): ${ley.relevantesEnfermeria || '?'}  artículos 
                </span>
            </button>`;
            });
            html += `</div>`;
        }
    }
    
    html += `</div>`;
    html += `<div id="resultadosBusqueda" style="display:none;"></div>`;
    
    contenido.innerHTML = html;

    setTimeout(() => {
        const btnSubir = document.createElement('button');
        btnSubir.id = 'btn-subir-biblioteca';
        btnSubir.style.cssText = 'position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;';
        btnSubir.textContent = '↑';
        btnSubir.onclick = function() { window.scrollTo({top:0, behavior:'smooth'}); };
        document.body.appendChild(btnSubir);
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                btnSubir.style.display = 'block';
                mostrarIndicador();
            } else {
                btnSubir.style.display = 'none';
                ocultarIndicador();
            }
        });
    }, 100);
}

// ============================================
// BUSCADOR UNIVERSAL
// ============================================
export async function buscarEnLeyes(texto) {
    const resultadosDiv = document.getElementById('resultadosBusqueda');
    const menuLeyes = document.getElementById('menu-leyes');
    
    if (!texto || texto.trim().length < 2) {
        if (resultadosDiv) resultadosDiv.style.display = 'none';
        if (menuLeyes) menuLeyes.style.display = 'block';
        ocultarIndicador();
        return;
    }
    
    const termino = texto.trim().toLowerCase();
    let resultados = [];
    
    for (const leyInfo of leyesDisponibles) {
        try {
            const response = await fetch(leyInfo.archivo);
            const leyData = await response.json();
            
            if (leyData.articulosDestacados) {
                leyData.articulosDestacados.forEach(art => {
                    const buscarEn = (art.numero + ' ' + art.descripcion + ' ' + (art.texto || '')).toLowerCase();
                    if (buscarEn.includes(termino)) {
                        resultados.push({
                            leyNombre: leyData.nombre,
                            leyId: leyInfo.id,
                            articuloNum: art.numero,
                            descripcion: art.descripcion,
                            texto: art.texto || 'Sin contenido disponible.'
                        });
                    }
                });
            }
        } catch (e) {}
    }
    
    if (resultados.length === 0) {
        resultadosDiv.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--texto-secundario);">
                🔍 No se encontraron resultados para "${texto.trim()}".
            </div>
        `;
    } else {
        let html = `<div style="background: rgba(13, 110, 253, 0.05); border: 2px solid var(--azul); border-radius: 12px; padding: 16px;">
    <h3 style="color: var(--texto-principal); margin: 0 0 12px 0;">📋 ${resultados.length} resultado(s) encontrados:</h3>`;
    
        resultados.forEach(r => {
            const fragmento = r.texto.substring(0, 120) + '...';
            const artNumEscaped = r.articuloNum.replace(/'/g, "\\'");
            const descEscaped = r.descripcion.replace(/'/g, "\\'");
            const textoEscaped = r.texto.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            html += `
                <div class="articulo-item" onclick="abrirPopupBusqueda('${r.leyId}', '${artNumEscaped}', '${descEscaped}', '${textoEscaped}')" style="cursor:pointer;">
                    <strong>📄 ${r.leyNombre}</strong><br>
                    <span class="articulo-numero">${r.articuloNum}: ${r.descripcion}</span>
                    <p class="articulo-fragmento">${fragmento}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        resultadosDiv.innerHTML = html;
    }
    
    resultadosDiv.style.display = 'block';
    setTimeout(() => {
        const top = resultadosDiv.getBoundingClientRect().top + window.scrollY - 160;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 200);
}

// ============================================
// INDICADOR DE SCROLL
// ============================================
function mostrarIndicador() {
    const existente = document.getElementById('indicador-scroll-biblio');
    if (existente) return;
    
    const resultadosDiv = document.getElementById('resultadosBusqueda');
    if (resultadosDiv && resultadosDiv.style.display === 'block' && resultadosDiv.innerHTML.trim() !== '') {
        const indicador = document.createElement('p');
        indicador.id = 'indicador-scroll-biblio';
        indicador.style.cssText = 'text-align:center; color:white; font-size:1rem; margin-bottom:8px; padding:10px; background:#6c757d; border-radius:8px; font-weight:bold;';
        indicador.textContent = 'Usa el botón azul (Flecha ↑) de la parte inferior, para volver al buscador';
        resultadosDiv.parentNode.insertBefore(indicador, resultadosDiv);
    }
}

function ocultarIndicador() {
    const indicador = document.getElementById('indicador-scroll-biblio');
    if (indicador) indicador.remove();
}

// ============================================
// ABRIR POPUP DESDE RESULTADOS DE BÚSQUEDA
// ============================================
function abrirPopupBusqueda(leyId, articuloNum, descripcion, texto) {
    const btnSubirBiblioteca = document.getElementById('btn-subir-biblioteca');
    if (btnSubirBiblioteca) btnSubirBiblioteca.style.display = 'none';
    ocultarIndicador();
    
    const modalExistente = document.getElementById('modalArticulo');
    if (modalExistente) modalExistente.remove();
    
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalArticulo';
    modalDiv.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.95); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;';
    
    modalDiv.onclick = function(e) { 
        if (e.target === modalDiv) {
            modalDiv.remove();
            const btnSubir = document.getElementById('btn-subir-biblioteca');
            if (btnSubir && window.scrollY > 300) btnSubir.style.display = 'block';
        }
    };
    
    modalDiv.innerHTML = `
        <div style="background:var(--bg-secundario); max-width:500px; width:100%; border-radius:12px; padding:20px; max-height:80%; overflow-y:auto;" id="modal-scroll">
            <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                <button style="padding:8px 16px; background:var(--azul); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="document.getElementById('modalArticulo').remove(); var b = document.getElementById('btn-subir-biblioteca'); if(b && window.scrollY > 300) b.style.display = 'block';">← Volver</button>
            </div>
            <h3 style="margin:0 0 15px 0;">${articuloNum}: ${descripcion}</h3>
            <div style="line-height:1.6;">${texto}</div>
        </div>
        <button id="btn-subir" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="var m = document.getElementById('modal-scroll'); if(m) m.scrollTop = 0;">↑</button>
    `;
    
    document.body.appendChild(modalDiv);
    
    setTimeout(() => {
        const modalScroll = document.getElementById('modal-scroll');
        const btnSubir = document.getElementById('btn-subir');
        if (modalScroll && btnSubir) {
            modalScroll.addEventListener('scroll', function() {
                btnSubir.style.display = modalScroll.scrollTop > 200 ? 'block' : 'none';
            });
        }
    }, 100);
}

window.abrirPopupBusqueda = abrirPopupBusqueda;
window.buscarEnLeyes = buscarEnLeyes;

// ============================================
// NAVEGACIÓN
// ============================================
export function irAPrincipalDesdePreguntas() {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('tab-biblioteca').classList.add('active');
    document.querySelector('.tab-button:first-child').classList.add('active');
    mostrarPantallaPrincipal();
}