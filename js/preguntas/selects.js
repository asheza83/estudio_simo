// ============================================
// SELECTS - Inicializar selects anidados
// ============================================

import { subcategoriasConfig } from './config.js';

// Función para resetear selects y botón a estado inicial
export function resetearSelectoresCompletos() {
    const tipoSelect = document.getElementById('tipo-competencia');
    const subcategoriaSelect = document.getElementById('subcategoria-competencia');
    const btnExamen = document.getElementById('btn-comenzar-examen');
    
    if (tipoSelect) {
        tipoSelect.value = '';
    }
    
    if (subcategoriaSelect) {
        subcategoriaSelect.innerHTML = '<option value="">Primero selecciona el tipo de competencia</option>';
        subcategoriaSelect.style.display = 'none';
        subcategoriaSelect.disabled = true;
    }
    
    if (btnExamen) {
        btnExamen.disabled = true;
    }
}

export function inicializarSelectsCompetencias() {
    const tipoSelect = document.getElementById('tipo-competencia');
    const subcategoriaSelect = document.getElementById('subcategoria-competencia');
    const btnExamen = document.getElementById('btn-comenzar-examen');
    
    if (!tipoSelect || !subcategoriaSelect) return;
    
    // 🔥 RESET: limpiar selects al inicio
    resetearSelectoresCompletos();
    
    // Remover event listeners previos clonando y reemplazando
    const nuevoTipoSelect = tipoSelect.cloneNode(true);
    tipoSelect.parentNode.replaceChild(nuevoTipoSelect, tipoSelect);
    
    const nuevoSubSelect = subcategoriaSelect.cloneNode(true);
    subcategoriaSelect.parentNode.replaceChild(nuevoSubSelect, subcategoriaSelect);
    
    // Obtener las referencias actualizadas
    const tipoSelectFinal = document.getElementById('tipo-competencia');
    const subSelectFinal = document.getElementById('subcategoria-competencia');
    const btnExamenFinal = document.getElementById('btn-comenzar-examen');
    
    tipoSelectFinal.addEventListener('change', function() {
        const tipo = this.value;
        
        if (tipo && subcategoriasConfig[tipo]) {
            // LIMPIAR y LLENAR el select de subcategorías
            subSelectFinal.innerHTML = '<option value="">Selecciona una subcategoría...</option>';
            subcategoriasConfig[tipo].forEach(sub => {
                subSelectFinal.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
            });
            
            // MOSTRAR y HABILITAR
            subSelectFinal.style.display = 'block';
            subSelectFinal.disabled = false;
            
            // SCROLL AL SELECT DE SUBCATEGORÍAS
            setTimeout(() => {
                subSelectFinal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                subSelectFinal.style.transition = 'box-shadow 0.3s';
                subSelectFinal.style.boxShadow = '0 0 0 2px var(--azul)';
                setTimeout(() => {
                    subSelectFinal.style.boxShadow = '';
                }, 1000);
            }, 150);
            
            if (btnExamenFinal) btnExamenFinal.disabled = true;
        } else {
            subSelectFinal.style.display = 'none';
            subSelectFinal.disabled = true;
            if (btnExamenFinal) btnExamenFinal.disabled = true;
        }
    });
    
    subSelectFinal.addEventListener('change', function() {
        const seleccionado = this.value !== '';
        if (btnExamenFinal) btnExamenFinal.disabled = !seleccionado;
        
        // SCROLL AL BOTÓN COMENZAR EXAMEN
        if (seleccionado) {
            setTimeout(() => {
                btnExamenFinal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                btnExamenFinal.style.transition = 'box-shadow 0.3s';
                btnExamenFinal.style.boxShadow = '0 0 0 2px var(--azul)';
                setTimeout(() => {
                    btnExamenFinal.style.boxShadow = '';
                }, 1000);
            }, 150);
        }
    });
}