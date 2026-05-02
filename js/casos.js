// ============================================
// MÓDULO: casos.js
// Manejo de casos prácticos y dilemas éticos (con paginación)
// ============================================

let casosData = [];
let categoriaActual = 'todos';
let paginaActual = 1;
const CASOS_POR_PAGINA = 10;

export async function cargarCasos() {
    const container = document.getElementById('casos-container');
    if (!container) return;
    
    if (container.getAttribute('data-cargado') === 'true') return;
    
    try {
        const response = await fetch('datos/casos.json');
        const data = await response.json();
        casosData = data.casos;
        
        let html = `
            <div style="background-color: var(--azul); color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">🩺 Casos prácticos y dilemas éticos</h3>
                <p style="margin: 0;">Situaciones reales que evalúa SIMO en competencias funcionales y comportamentales</p>
            </div>
        `;

        // Filtros por categoría
        html += `
            <div style="margin-bottom: 16px;">
                <p style="font-weight: bold; margin-bottom: 8px;">📂 Filtrar por competencia:</p>
                <div id="categoriasCasos" style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button class="letra-btn active" data-categoria="todos" onclick="filtrarCasosPorCategoria('todos')" style="font-size: 1rem;">TODAS</button>
                <button class="letra-btn" data-categoria="competencias-basicas" onclick="filtrarCasosPorCategoria('competencias-basicas')" style="font-size: 1rem;">📖 Básicas</button>
                <button class="letra-btn" data-categoria="competencias-funcionales" onclick="filtrarCasosPorCategoria('competencias-funcionales')" style="font-size: 1rem;">🩺 Funcionales</button>
                <button class="letra-btn" data-categoria="competencias-comportamentales" onclick="filtrarCasosPorCategoria('competencias-comportamentales')" style="font-size: 1rem;">🤝 Comportamentales</button>
            </div>
            </div>
            <div id="casos-lista" style="transition: opacity 0.3s ease-in-out;"></div>
            <div id="paginacionCasos" style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; padding-bottom: 20px;"></div>
        `;
        
        container.innerHTML = html;
        container.setAttribute('data-cargado', 'true');
        
        actualizarListaCasos();
        
    } catch (error) {
        console.error('Error cargando casos:', error);
        container.innerHTML = '<p>❌ Error al cargar los casos prácticos.</p>';
    }
}

function actualizarListaCasos() {
    // Filtrar por categoría
    const filtrados = categoriaActual === 'todos' 
        ? casosData 
        : casosData.filter(caso => caso.categoria === categoriaActual);
    
    const totalCasos = filtrados.length;
    const totalPaginas = Math.ceil(totalCasos / CASOS_POR_PAGINA);
    
    // Ajustar página actual si es mayor que el total
    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas > 0 ? totalPaginas : 1;
    }
    
    // Calcular índices de paginación
    const startIndex = (paginaActual - 1) * CASOS_POR_PAGINA;
    const endIndex = startIndex + CASOS_POR_PAGINA;
    const casosPagina = filtrados.slice(startIndex, endIndex);
    
    // Generar contenido directamente (sin fade)
    const container = document.getElementById('casos-lista');
    if (!container) return;
    
    // Resetear opacidad (sin animación)
    container.style.transition = 'none';
    container.style.opacity = '1';
    
    // Generar nuevo contenido
    if (casosPagina.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">📭 No hay casos en esta categoría.</p>';
    } else {
        let html = '';
        casosPagina.forEach((caso, index) => {
            let badgeColor = '';
            let badgeText = '';
            
            switch (caso.categoria) {
                case 'competencias-basicas':
                    badgeColor = '#6c757d';
                    badgeText = '📖 Básicas';
                    break;
                case 'competencias-funcionales':
                    badgeColor = '#0d6efd';
                    badgeText = '🩺 Funcionales';
                    break;
                case 'competencias-comportamentales':
                    badgeColor = '#198754';
                    badgeText = '🤝 Comportamentales';
                    break;
            }
            
            html += `
                <div style="background-color: var(--bg-principal); padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid var(--azul); transition: transform 0.2s, box-shadow 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 10px;">
                        <h4 style="margin: 0;">${startIndex + index + 1}. ${caso.titulo}</h4>                        
                        <span style="background: ${badgeColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 1rem;">${badgeText}</span>
                    </div>
                    <p><strong>Situación:</strong> ${caso.situacion}</p>
                    <details>
                        <summary style="cursor: pointer; color: var(--azul); font-weight: bold;">👁️ Ver respuesta orientativa</summary>
                        <p style="margin-top: 10px; padding: 10px; background: rgba(13,110,253,0.1); border-radius: 8px;">${caso.respuesta}</p>
                    </details>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // Restaurar transición para futuros fades (opcional)
    container.style.transition = 'opacity 0.3s ease-in-out';
    
    // Actualizar paginación
    actualizarPaginacion(totalPaginas);
}

function actualizarPaginacion(totalPaginas) {
    const pagContainer = document.getElementById('paginacionCasos');
    if (!pagContainer) return;
    
    if (totalPaginas <= 1) {
        pagContainer.innerHTML = '';
        return;
    }
    
    const anteriorDisabled = paginaActual === 1;
    const siguienteDisabled = paginaActual === totalPaginas;
    
    let html = '';
    
    // Botón Anterior
    html += `<button onclick="cambiarPaginaCasos(-1)" ${anteriorDisabled ? 'disabled' : ''} style="background-color: ${anteriorDisabled ? '#6c757d' : 'var(--azul)'}; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: ${anteriorDisabled ? 'not-allowed' : 'pointer'}; font-size: 0.9rem; transition: background-color 0.2s, transform 0.1s; opacity: ${anteriorDisabled ? '0.6' : '1'};">◀ Anterior</button>`;
    
    html += `<span style="margin: 0 15px; color: var(--texto-principal);">Página ${paginaActual} de ${totalPaginas}</span>`;
    
    // Botón Siguiente
    html += `<button onclick="cambiarPaginaCasos(1)" ${siguienteDisabled ? 'disabled' : ''} style="background-color: ${siguienteDisabled ? '#6c757d' : 'var(--azul)'}; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: ${siguienteDisabled ? 'not-allowed' : 'pointer'}; font-size: 0.9rem; transition: background-color 0.2s, transform 0.1s; opacity: ${siguienteDisabled ? '0.6' : '1'};">Siguiente ▶</button>`;
    
    pagContainer.innerHTML = html;
    
    // Agregar estilos hover solo para botones habilitados
    const btns = pagContainer.querySelectorAll('button');
    btns.forEach(btn => {
        if (!btn.disabled) {
            btn.onmouseenter = () => {
                btn.style.backgroundColor = 'var(--azul-hover)';
                btn.style.transform = 'scale(1.02)';
            };
            btn.onmouseleave = () => {
                btn.style.backgroundColor = 'var(--azul)';
                btn.style.transform = 'scale(1)';
            };
        }
    });
}

window.cambiarPaginaCasos = function(direccion) {
    // Calcular total de páginas con el filtro actual
    const filtrados = categoriaActual === 'todos' 
        ? casosData 
        : casosData.filter(caso => caso.categoria === categoriaActual);
    const totalPaginas = Math.ceil(filtrados.length / CASOS_POR_PAGINA);
    
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        actualizarListaCasos();
    }
};

window.filtrarCasosPorCategoria = function(categoria) {
    categoriaActual = categoria;
    paginaActual = 1;
    
    // Actualizar botones activos
    document.querySelectorAll('#categoriasCasos .letra-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === categoria) {
            btn.classList.add('active');
        }
    });
    
    actualizarListaCasos();
};

window.cargarCasos = cargarCasos;