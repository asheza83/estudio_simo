// ============================================
// MÓDULO: procedimientos.js
// Manejo de procedimientos con acordeón (details) y animaciones
// ============================================

let procedimientosData = [];
let categoriaActual = 'todos';
let paginaActual = 1;
const PROCEDIMIENTOS_POR_PAGINA = 10;

export async function cargarProcedimientos() {
    const container = document.getElementById('procedimientos-container');
    if (!container) return;
    if (container.getAttribute('data-cargado') === 'true') return;
    
    try {
        const response = await fetch('datos/procedimientos.json');
        const data = await response.json();
        procedimientosData = data.procedimientos;
        
        let html = `
            <div style="background-color: var(--azul); color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">🩺 Procedimientos de enfermería en salud mental</h3>
                <p style="margin: 0;">Guía paso a paso para procedimientos clínicos en HOMERIS (enfoque SIMO)</p>
                <p style="margin: 8px 0 0 0; font-size: 0.9rem; font-style: italic;">📌 Nota: Los procedimientos son de carácter informativo y tienen extensión corta para facilitar la consulta rápida. No reemplazan la práctica supervisada ni los protocolos institucionales.</p>
            </div>
        `;

        // Descripción de categorías (opcional, pero ayuda)
        html += `
            <div style="margin-bottom: 16px; background-color: var(--bg-principal); padding: 12px; border-radius: 10px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">📌 Categorías de procedimientos:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                    <span><strong>🛡️ Seguridad:</strong> Contención, prevención de suicidio, post-contención.</span>
                    <span><strong>💊 Medicación:</strong> Administración de psicofármacos, cálculo de dosis.</span>
                    <span><strong>📊 Valoración:</strong> Escalas de Glasgow, Norton, CIWA-Ar.</span>
                    <span><strong>🛌 Cuidados básicos:</strong> Prevención de caídas, úlceras por presión.</span>
                    <span><strong>🗣️ Comunicación:</strong> Desescalamiento verbal.</span>
                    <span><strong>🩺 Procedimientos clínicos:</strong> Toma de muestras en agitación.</span>
                </div>
            </div>
        `;

        // Filtros por categoría (igual que antes)
        const categoriasUnicas = [...new Set(procedimientosData.map(p => p.categoria))];
        let filtrosHtml = `<div style="margin-bottom: 16px;"><p style="font-weight: bold; margin-bottom: 8px;">📂 Filtrar por categoría:</p><div id="categoriasProcedimientos" style="display: flex; flex-wrap: wrap; gap: 6px;">`;
        filtrosHtml += `<button class="letra-btn active" data-categoria="todos" onclick="filtrarProcedimientosPorCategoria('todos')" style="font-size: 1rem;">TODAS</button>`;
        categoriasUnicas.forEach(cat => {
            filtrosHtml += `<button class="letra-btn" data-categoria="${cat}" onclick="filtrarProcedimientosPorCategoria('${cat}')" style="font-size: 1rem;">${cat}</button>`;
        });
        filtrosHtml += `</div></div>`;
        html += filtrosHtml;

        html += `<div style="margin-bottom: 12px; font-size: 1.2rem; color: var(--texto-secundario); background-color: rgba(13, 110, 253, 0.1); padding: 8px; border-radius: 8px; text-align: center;">💡 <strong>Consejo:</strong> Haz clic en cualquier procedimiento para ver los detalles (objetivo, material, pasos, etc.).</div>`;
        
        html += `<div id="procedimientos-lista" style="transition: opacity 0.3s ease-in-out;"></div>
                 <div id="paginacionProcedimientos" style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; padding-bottom: 20px;"></div>`;
        
        container.innerHTML = html;
        container.setAttribute('data-cargado', 'true');
        actualizarListaProcedimientos();
        
    } catch (error) {
        console.error('Error cargando procedimientos:', error);
        container.innerHTML = '<p>❌ Error al cargar los procedimientos.</p>';
    }
}

function actualizarListaProcedimientos() {
    const filtrados = categoriaActual === 'todos' 
        ? procedimientosData 
        : procedimientosData.filter(p => p.categoria === categoriaActual);
    
    const total = filtrados.length;
    const totalPaginas = Math.ceil(total / PROCEDIMIENTOS_POR_PAGINA);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas > 0 ? totalPaginas : 1;
    
    const start = (paginaActual - 1) * PROCEDIMIENTOS_POR_PAGINA;
    const end = start + PROCEDIMIENTOS_POR_PAGINA;
    const paginaProcs = filtrados.slice(start, end);
    
    const container = document.getElementById('procedimientos-lista');
    if (!container) return;
    
    container.style.transition = 'none';
    container.style.opacity = '1';
    
    if (paginaProcs.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">📭 No hay procedimientos en esta categoría.</p>';
    } else {
        let html = '';
        paginaProcs.forEach((proc, idx) => {
            // Badge según categoría
            let badgeColor = '';
            switch (proc.categoria) {
                case 'Seguridad': badgeColor = '#dc3545'; break;
                case 'Medicación': badgeColor = '#198754'; break;
                case 'Valoración': badgeColor = '#0d6efd'; break;
                case 'Cuidados básicos': badgeColor = '#6c757d'; break;
                case 'Comunicación': badgeColor = '#fd7e14'; break;
                default: badgeColor = '#0d6efd';
            }
            
            // Construir contenido interno del acordeón
            let contenidoInterno = '';
            
            if (proc.objetivo) contenidoInterno += `<p><strong>🎯 Objetivo:</strong> ${proc.objetivo}</p>`;
            
            if (proc.material && proc.material.length > 0) {
                contenidoInterno += `<p><strong>📦 Material necesario:</strong><br>• ${proc.material.join('<br>• ')}</p>`;
            }
            
            if (proc.pasos && proc.pasos.length > 0) {
                contenidoInterno += `<p><strong>📋 Pasos:</strong><br>${proc.pasos.join('<br>')}</p>`;
            }
            
            if (proc.precauciones && proc.precauciones.length > 0) {
                contenidoInterno += `<p><strong>⚠️ Precauciones:</strong><br>• ${proc.precauciones.join('<br>• ')}</p>`;
            }
            
            if (proc.normativa && proc.normativa.length > 0) {
                contenidoInterno += `<p><strong>📚 Normativa asociada:</strong><br>• ${proc.normativa.join('<br>• ')}</p>`;
            }
            
            if (proc.tiempo_estimado) contenidoInterno += `<p><strong>⏱️ Tiempo estimado:</strong> ${proc.tiempo_estimado}</p>`;
            
            // Acordeón (details) con título y badge
            html += `
                <details class="procedimiento-details" style="background-color: var(--bg-principal); border-radius: 12px; margin-bottom: 20px; border-left: 4px solid var(--azul);">
                    <summary style="display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; list-style: none;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="font-size: 1.2rem;">▶</span>
                            <strong style="font-size: 1.1rem;">${start + idx + 1}. ${proc.titulo}</strong>
                            <span style="background: ${badgeColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem;">${proc.categoria}</span>
                        </div>
                    </summary>
                    <div class="procedimiento-contenido" style="padding: 0 15px 15px 15px;">
                        ${contenidoInterno}
                    </div>
                </details>
            `;
        });
        container.innerHTML = html;
        
        // Aplicar animación al abrir/cerrar (igual que en casos.js)
        document.querySelectorAll('.procedimiento-details').forEach(details => {
            const summary = details.querySelector('summary');
            const contenido = details.querySelector('.procedimiento-contenido');
            const flechaSpan = summary.querySelector('span:first-child');
            let animating = false;
            
            summary.addEventListener('click', function(e) {
                e.preventDefault();
                if (animating) return;
                
                if (details.open) {
                    // Cerrar
                    animating = true;
                    contenido.style.animation = 'fadeSlideOut 0.25s ease forwards';
                    setTimeout(() => {
                        details.open = false;
                        contenido.style.animation = '';
                        animating = false;
                        if (flechaSpan) flechaSpan.textContent = '▶';
                    }, 500);
                } else {
                    // Abrir
                    details.open = true;
                    contenido.style.animation = 'fadeSlideIn 0.25s ease forwards';
                    animating = true;
                    setTimeout(() => {
                        contenido.style.animation = '';
                        animating = false;
                        if (flechaSpan) flechaSpan.textContent = '▼';
                    }, 500);
                }
            });
        });
    }
    
    container.style.transition = 'opacity 0.3s ease-in-out';
    actualizarPaginacionProcedimientos(totalPaginas);
}

function actualizarPaginacionProcedimientos(totalPaginas) {
    const pagContainer = document.getElementById('paginacionProcedimientos');
    if (!pagContainer) return;
    if (totalPaginas <= 1) {
        pagContainer.innerHTML = '';
        return;
    }
    
    const anteriorDisabled = paginaActual === 1;
    const siguienteDisabled = paginaActual === totalPaginas;
    
    let html = `<button onclick="cambiarPaginaProcedimientos(-1)" ${anteriorDisabled ? 'disabled' : ''} style="background-color: ${anteriorDisabled ? '#6c757d' : 'var(--azul)'}; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: ${anteriorDisabled ? 'not-allowed' : 'pointer'}; font-size: 0.9rem;">◀ Anterior</button>`;
    html += `<span style="margin: 0 15px; color: var(--texto-principal);">Página ${paginaActual} de ${totalPaginas}</span>`;
    html += `<button onclick="cambiarPaginaProcedimientos(1)" ${siguienteDisabled ? 'disabled' : ''} style="background-color: ${siguienteDisabled ? '#6c757d' : 'var(--azul)'}; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: ${siguienteDisabled ? 'not-allowed' : 'pointer'}; font-size: 0.9rem;">Siguiente ▶</button>`;
    pagContainer.innerHTML = html;
}

window.cambiarPaginaProcedimientos = function(direccion) {
    const filtrados = categoriaActual === 'todos' 
        ? procedimientosData 
        : procedimientosData.filter(p => p.categoria === categoriaActual);
    const totalPaginas = Math.ceil(filtrados.length / PROCEDIMIENTOS_POR_PAGINA);
    const nueva = paginaActual + direccion;
    if (nueva >= 1 && nueva <= totalPaginas) {
        paginaActual = nueva;
        actualizarListaProcedimientos();
    }
};

window.filtrarProcedimientosPorCategoria = function(categoria) {
    categoriaActual = categoria;
    paginaActual = 1;
    const btns = document.querySelectorAll('#categoriasProcedimientos .letra-btn');
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === categoria) btn.classList.add('active');
    });
    actualizarListaProcedimientos();
};

window.cargarProcedimientos = cargarProcedimientos;