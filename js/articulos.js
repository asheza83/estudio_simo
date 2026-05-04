// ============================================
// MÓDULO: articulos.js
// Búsqueda y visualización de artículos
// ============================================

import { leyActual } from './estado.js';

// Variables para el filtro de artículos
let articulosOriginales = [];
let filtroActual = "";

export function inicializarListaArticulos(articulos) {
    articulosOriginales = articulos;
    mostrarListaArticulos(articulosOriginales, "📌 Artículos relevantes para enfermería");
}

export function mostrarListaArticulos(articulos, titulo) {
    const container = document.getElementById('listaArticulos');
    if (!container) return;
    
    let html = `<h3>${titulo}</h3>`;
    html += `<p style="font-size: 1.1rem; color: var(--texto-secundario); margin-bottom: 10px;">⬇️ Haz clic en cualquier artículo para ver su contenido</p>`;
    
    if (articulos.length === 0) {
        html += `<p style="color: var(--texto-secundario); padding: 20px; text-align: center;">🔍 No se encontraron artículos que coincidan con "${filtroActual}".</p>`;
    } else {
        articulos.forEach(art => {
            html += `<div class="articulo-item" onclick="mostrarArticulo('${art.numero}')">📄 ${art.numero}: ${art.descripcion}</div>`;
        });
    }
    
    container.innerHTML = html;
}

export function filtrarArticulos(texto) {
    filtroActual = texto.trim().toLowerCase();
    
    if (!filtroActual || filtroActual === '') {
        mostrarListaArticulos(articulosOriginales, "📌 Artículos relevantes para enfermería");
    } else {
        const filtrados = articulosOriginales.filter(art => 
            art.numero.toLowerCase().includes(filtroActual) ||
            art.descripcion.toLowerCase().includes(filtroActual)
        );
        mostrarListaArticulos(filtrados, `🔍 Resultados de búsqueda para "${filtroActual}"`);
    }
}

export function buscarArticuloPorNumero(numero) {
    filtrarArticulos(numero);
}

export function buscarArticulo(texto) {
    if (texto.includes("Título I") || texto.includes("Principios y definiciones")) {
        alert("📘 TÍTULO I: Principios y definiciones del SGSSS\n\nUse el buscador para artículos específicos (ej: 153, 156, 157, 162) o consulte los Artículos relevantes.");
    } 
    else if (texto.includes("Título II") || texto.includes("Regímenes de afiliación")) {
        alert("📘 TÍTULO II: Regímenes de afiliación\n\nUse el buscador para artículos específicos (ej: 180, 182, 190-194, 202, 204, 211) o consulte los Artículos relevantes.");
    }
    else {
        alert(`📘 ${texto}\n\nPara más detalles, use el buscador de artículos (ej: 153, 157, 202).`);
    }
}

export function mostrarArticulo(numeroArticulo) {
    // Ocultar botón subir de la ley
    const btnSubirLey = document.getElementById('btn-subir-ley');
    if (btnSubirLey) btnSubirLey.style.display = 'none';
    
    // Ocultar botón subir de la biblioteca
    const btnSubirBiblio = document.getElementById('btn-subir-biblioteca');
    if (btnSubirBiblio) btnSubirBiblio.style.display = 'none';
    
    // Ocultar indicador de la biblioteca
    const indicadorBiblio = document.getElementById('indicador-scroll-biblio');
    if (indicadorBiblio) indicadorBiblio.remove();
    
    const articulosLista = leyActual.articulos || leyActual.articulosDestacados || [];
    const articuloInfo = articulosLista.find(art => art.numero === numeroArticulo);

    let textoArticulo = "";
    
    if (articuloInfo && articuloInfo.texto) {
        textoArticulo += articuloInfo.texto;
    }
    else if (leyActual.textoCompleto) {
        const textoCompleto = leyActual.textoCompleto;
        const num = numeroArticulo.replace(/Artículo\s*/i, '').trim();
        
        let encontrado = false;
        let textoEncontrado = '';
        
        const lineas = textoCompleto.split('\n');
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            const regexLinea = new RegExp(`Art[ií]culo\\s+${num}\\b`, 'i');
            
            if (regexLinea.test(linea)) {
                textoEncontrado += linea + '\n';
                for (let j = i + 1; j < lineas.length; j++) {
                    if (/Art[ií]culo\s+\d+/i.test(lineas[j]) && 
                        !lineas[j].toLowerCase().includes('artículos') &&
                        !lineas[j].toLowerCase().includes('artículo ' + num)) {
                        break;
                    }
                    textoEncontrado += lineas[j] + '\n';
                }
                encontrado = true;
                break;
            }
        }
        
        if (!encontrado) {
            const regexGlobal = new RegExp(`Art[ií]culo\\s+${num}\\b`, 'i');
            const match = textoCompleto.match(regexGlobal);
            
            if (match) {
                const inicio = match.index;
                const resto = textoCompleto.substring(inicio + match[0].length);
                const siguienteMatch = resto.match(/Art[ií]culo\s+\d+\b/i);
                
                let fin;
                if (siguienteMatch) {
                    fin = inicio + match[0].length + siguienteMatch.index;
                } else {
                    fin = Math.min(inicio + 600, textoCompleto.length);
                }
                
                textoEncontrado = textoCompleto.substring(inicio, fin).trim();
                encontrado = true;
            }
        }
        
        if (encontrado && textoEncontrado.trim().length > 0) {
            textoArticulo += textoEncontrado.replace(/\n/g, '<br>');
        } else {
            textoArticulo += `Contenido del ${numeroArticulo} de ${leyActual.nombre}.<br><br>`;
            textoArticulo += `Este artículo no se encontró en el resumen de la ley.`;
        }
    }
    
    const modalExistente = document.getElementById('modalArticulo');
    if (modalExistente) modalExistente.remove();
    
    const modalDiv = document.createElement('div');
    document.body.style.overflow = 'hidden';

    modalDiv.id = 'modalArticulo';
    modalDiv.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;';
    
    modalDiv.innerHTML = `
    <div style="background:var(--bg-secundario); max-width:500px; width:100%; border-radius:12px; padding:20px; max-height:80%; overflow-y:auto;" id="modal-scroll">
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button style="padding:8px 16px; background:var(--azul); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="cerrarModal()">← Volver</button>
        </div>
        <h3 style="margin:0 0 15px 0;">${numeroArticulo}: ${articuloInfo ? articuloInfo.descripcion : ''}</h3>
        <div style="line-height:1.6;">${textoArticulo}</div>
    </div>
    
    <button id="btn-subir" style="position:fixed; bottom:30px; right:30px; width:50px; height:50px; background:var(--azul); color:white; border:none; border-radius:50%; font-size:1rem; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:none; z-index:1001;" onclick="var m = document.getElementById('modal-scroll'); if(m) m.scrollTo({top:0, behavior:'smooth'});">Subir</button>
    `;

       setTimeout(() => {
        const modalScroll = document.getElementById('modal-scroll');
        const btnSubir = document.getElementById('btn-subir');
        
        if (modalScroll && btnSubir) {
            modalScroll.addEventListener('scroll', function() {
                if (modalScroll.scrollTop > 200) {
                    btnSubir.style.display = 'block';
                } else {
                    btnSubir.style.display = 'none';
                }
            });
        }
    }, 100);
    
    // Agregar clase al body para ocultar el botón subir
    document.body.classList.add('modal-abierto');
    
    document.body.appendChild(modalDiv);
}

export function cerrarModal() {
    const modal = document.getElementById('modalArticulo');
    if (modal) modal.remove();
    
    // Eliminar clase del body para mostrar el botón subir
    document.body.classList.remove('modal-abierto');
    
    // Forzar verificación del botón subir después de cerrar el popup
    const btnSubir = document.getElementById('btn-subir-biblioteca');
    if (btnSubir) {
        if (window.scrollY > 300) {
            btnSubir.style.display = 'block';
        } else {
            btnSubir.style.display = 'none';
        }
    }
    
    document.body.style.overflow = '';
}

export function cerrarArticulo() {
    const articuloContainer = document.getElementById('articuloSeleccionado');
    if (articuloContainer) {
        articuloContainer.remove();
    }
}