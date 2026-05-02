// ============================================
// MÓDULO: glosario.js
// Sistema completo de glosario
// ============================================

let categoriaActual = 'TODAS';

import { 
    glosarioData, glosarioFiltrado, letraActual, paginaActual, TERMINOS_POR_PAGINA,
    setGlosarioData, setGlosarioFiltrado, setLetraActual, setPaginaActual
} from './estado.js';

function resaltarTexto(texto, terminoBusqueda) {
    if (!terminoBusqueda || terminoBusqueda.trim() === '') return texto;
    const regex = new RegExp(`(${terminoBusqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark style="background-color: #ffc107; color: #000; padding: 0 2px; border-radius: 3px;">$1</mark>');
}

export async function mostrarGlosario() {
    try {
        const response = await fetch('datos/glosario.json');
        const data = await response.json();
        setGlosarioData(data.terminos);
        setGlosarioFiltrado([...glosarioData]);
        
        const container = document.getElementById('contenido-glosario');
        
        let html = `
            <div style="background: var(--azul); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                <label for="buscadorGlosario" style="color: white; font-weight: bold; font-size: 1rem; display: block; margin-bottom: 8px;">🔍 Buscar término o palabra (presiona Enter para buscar)</label>
                <input type="text" id="buscadorGlosario" class="buscador" placeholder="Escriba el término o palabra (mínimo 3 letras)" style="width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; background: white; color: #212529;">
            </div>`;

            html += `
                <div style="margin-bottom: 16px;">
                    <p style="font-weight: bold; margin-bottom: 8px;">📂 Filtrar por categoría:</p>
                    <div id="categoriasContainer" style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <button class="letra-btn active" data-categoria="TODAS" onclick="filtrarPorCategoria('TODAS')">TODAS</button>
                        <button class="letra-btn" data-categoria="siglas" onclick="filtrarPorCategoria('siglas')">Siglas</button>
                        <button class="letra-btn" data-categoria="entidades" onclick="filtrarPorCategoria('entidades')">Entidades</button>
                        <button class="letra-btn" data-categoria="terminos" onclick="filtrarPorCategoria('terminos')">Términos o palabra</button>
                        <button class="letra-btn" data-categoria="principios" onclick="filtrarPorCategoria('principios')">Principios</button>
                        <button class="letra-btn" data-categoria="carrera" onclick="filtrarPorCategoria('carrera')">Carrera</button>
                    </div>
                </div>
            `;
            html += `</div>`;
            html += `<p style="font-weight: bold; margin: 16px 0 8px 0;">🔤 Filtrar por letra:</p>`;
            html += `<div id="letrasContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; justify-content: center;">
                    <button class="letra-btn active" data-letra="TODAS" onclick="filtrarPorLetra('TODAS')">TODAS</button>
            `;
        
        const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        letras.forEach(letra => {
            html += `<button class="letra-btn" data-letra="${letra}" onclick="filtrarPorLetra('${letra}')">${letra}</button>`;
        });
        
        html += `</div>`;
        html += `<div id="glosarioLista"></div>`;
        html += `<div id="paginacionContainer" style="display: flex; justify-content: flex-start; align-items: center; gap: 10px; margin-top: 20px; padding-bottom: 80px;"></div>`;
        html += `
        <button id="btn-subir-ley" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑</button>
        `;
        
        container.innerHTML = html;

        setTimeout(() => {
            const btnSubir = document.getElementById('btn-subir-ley');
            if (btnSubir) {
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 300) {
                        btnSubir.style.display = 'block';
                        mostrarIndicador();
                    } else {
                        btnSubir.style.display = 'none';
                        ocultarIndicador();
                    }
                });
            }
        }, 100);
        
        const buscador = document.getElementById('buscadorGlosario');
        if (buscador) {
            buscador.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    ejecutarBusqueda();
                }
            });
        }        
    
        actualizarListaGlosario();
                    
    } catch (error) {
        console.error('Error cargando glosario:', error);
        document.getElementById('contenido-glosario').innerHTML = '<p style="color:red;">❌ Error al cargar el glosario. Verifica que el archivo datos/glosario.json exista.</p>';
    }
}

function ejecutarBusqueda() {
    const buscador = document.getElementById('buscadorGlosario');
    if (!buscador) return;
    
    const texto = buscador.value.trim().toLowerCase();
    
    if (texto.length >= 3) {
        setGlosarioFiltrado(glosarioData.filter(item => 
            item.termino.toLowerCase().includes(texto) || 
            item.definicion.toLowerCase().includes(texto)
        ));
        categoriaActual = 'TODAS';
        setLetraActual('TODAS');
        setPaginaActual(1);
        
        document.querySelectorAll('#categoriasContainer .letra-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-categoria') === 'TODAS') btn.classList.add('active');
        });
        
        document.querySelectorAll('#letrasContainer .letra-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-letra') === 'TODAS') btn.classList.add('active');
        });
    } else if (texto.length === 0) {
        aplicarFiltros();
        return;
    }
    
    actualizarListaGlosario();
    
    if (texto.length >= 3) {
        setTimeout(() => {
            const glosarioLista = document.getElementById('glosarioLista');
            if (glosarioLista) {
                const top = glosarioLista.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: top, behavior: 'smooth' });
                setTimeout(() => {
                    if (window.scrollY > 300) {
                        mostrarIndicador();
                    }
                }, 500);
            }
        }, 200);
    }
}

function aplicarFiltros() {
    let filtrados = [...glosarioData];
    
    if (categoriaActual !== 'TODAS') {
        filtrados = filtrados.filter(item => item.categoria === categoriaActual);
    }
    
    if (letraActual !== 'TODAS') {
        filtrados = filtrados.filter(item => 
            item.termino.charAt(0).toUpperCase() === letraActual
        );
    }
    
    setGlosarioFiltrado(filtrados);
    setPaginaActual(1);
    actualizarListaGlosario();
    
    setTimeout(() => {
        const glosarioLista = document.getElementById('glosarioLista');
        if (glosarioLista) {
            const top = glosarioLista.getBoundingClientRect().top + window.scrollY - 260;
            window.scrollTo({ top: top, behavior: 'smooth' });
            setTimeout(() => {
                if (window.scrollY > 300) {
                    mostrarIndicador();
                }
            }, 500);
        }
    }, 200);
}

function mostrarIndicador() {
    const existente = document.getElementById('indicador-scroll');
    if (existente) return;
    
    const glosarioLista = document.getElementById('glosarioLista');
    if (glosarioLista && glosarioFiltrado.length > 0) {
        const indicador = document.createElement('p');
        indicador.id = 'indicador-scroll';
        indicador.style.cssText = 'text-align:center; color:white; font-size:1rem; margin-bottom:8px; padding:10px; background:#6c757d; border-radius:8px; font-weight:bold;';
        indicador.textContent = 'Usa el botón azul (Flecha ↑) de la parte inferior, para volver a los filtros de búsqueda';
        glosarioLista.parentNode.insertBefore(indicador, glosarioLista);
    }
}

function ocultarIndicador() {
    const indicador = document.getElementById('indicador-scroll');
    if (indicador) indicador.remove();
}

export function filtrarPorLetra(letra) {
    const buscador = document.getElementById('buscadorGlosario');
    if (buscador) buscador.value = '';
    
    setLetraActual(letra);
    
    document.querySelectorAll('#letrasContainer .letra-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-letra') === letra) btn.classList.add('active');
    });
    
    aplicarFiltros();
}

export function filtrarPorCategoria(categoria) {
    const buscador = document.getElementById('buscadorGlosario');
    if (buscador) buscador.value = '';
    
    categoriaActual = categoria;
    
    document.querySelectorAll('#categoriasContainer .letra-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === categoria) btn.classList.add('active');
    });
    
    aplicarFiltros();
}

function actualizarListaGlosario() {
    const startIndex = (paginaActual - 1) * TERMINOS_POR_PAGINA;
    const endIndex = startIndex + TERMINOS_POR_PAGINA;
    const paginados = glosarioFiltrado.slice(startIndex, endIndex);
    const totalPaginas = Math.ceil(glosarioFiltrado.length / TERMINOS_POR_PAGINA);
    
    // Obtener término de búsqueda
    const buscador = document.getElementById('buscadorGlosario');
    const terminoBusqueda = buscador ? buscador.value.trim() : '';
    
    let html = '<div class="glosario-lista">';
    
    if (paginados.length === 0) {
        html += '<p style="text-align: center; padding: 40px;">📭 No se encontraron términos o palabras.</p>';
    } else {
        paginados.forEach(item => {
            let terminoMostrar = item.termino;
            let definicionMostrar = item.definicion;
            
            // Resaltar si hay búsqueda activa
            if (terminoBusqueda) {
                terminoMostrar = resaltarTexto(item.termino, terminoBusqueda);
                definicionMostrar = resaltarTexto(item.definicion, terminoBusqueda);
            }
            
            html += `
                <div class="glosario-item">
                    <div class="glosario-termino">${terminoMostrar}</div>
                    <div class="glosario-definicion">${definicionMostrar}</div>
                </div>
            `;
        });
    }
    html += '</div>';
    
    document.getElementById('glosarioLista').innerHTML = html;
    
    let pagHtml = '';
    if (totalPaginas > 1) {
        pagHtml += `<button onclick="cambiarPagina(-1)" ${paginaActual === 1 ? 'disabled' : ''}>◀ Anterior</button>`;
        pagHtml += `<span style="margin: 0 15px;">Página ${paginaActual} de ${totalPaginas}</span>`;
        pagHtml += `<button onclick="cambiarPagina(1)" ${paginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ▶</button>`;
    }
    document.getElementById('paginacionContainer').innerHTML = pagHtml;
}

export function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(glosarioFiltrado.length / TERMINOS_POR_PAGINA);
    const nuevaPagina = paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        setPaginaActual(nuevaPagina);
        actualizarListaGlosario();
        
        // Scroll suave al inicio del glosario (igual que en ejecutarBusqueda y aplicarFiltros)
        setTimeout(() => {
            const glosarioLista = document.getElementById('glosarioLista');
            if (glosarioLista) {
                const top = glosarioLista.getBoundingClientRect().top + window.scrollY - 270;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        }, 200);
    }
}

window.filtrarPorCategoria = filtrarPorCategoria;