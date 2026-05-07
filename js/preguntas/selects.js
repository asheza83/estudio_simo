// ============================================
// SELECTS - Inicializar selects anidados
// ============================================

import { subcategoriasConfig } from './config.js';

export function inicializarSelectsCompetencias() {
    const tipoSelect = document.getElementById('tipo-competencia');
    const subcategoriaSelect = document.getElementById('subcategoria-competencia');
    const btnExamen = document.getElementById('btn-comenzar-examen');
    
    if (!tipoSelect || !subcategoriaSelect) return;
    
    tipoSelect.addEventListener('change', function() {
        const tipo = this.value;
        
        if (tipo && subcategoriasConfig[tipo]) {
            // LIMPIAR y LLENAR el select de subcategorías (no crear)
            subcategoriaSelect.innerHTML = '<option value="">Selecciona una subcategoría...</option>';
            subcategoriasConfig[tipo].forEach(sub => {
                subcategoriaSelect.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
            });
            
            // MOSTRAR y HABILITAR
            subcategoriaSelect.style.display = 'block';
            subcategoriaSelect.disabled = false;
            
            // ========================================
            // SCROLL AL SELECT DE SUBCATEGORÍAS (igual que el código que funcionó en consola)
            // ========================================
            setTimeout(() => {
                subcategoriaSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                subcategoriaSelect.style.transition = 'box-shadow 0.3s';
                subcategoriaSelect.style.boxShadow = '0 0 0 2px var(--azul)';
                setTimeout(() => {
                    subcategoriaSelect.style.boxShadow = '';
                }, 1000);
            }, 150);
            
            btnExamen.disabled = true;
        } else {
            subcategoriaSelect.style.display = 'none';
            subcategoriaSelect.disabled = true;
            btnExamen.disabled = true;
        }
    });
    
    subcategoriaSelect.addEventListener('change', function() {
        const btnExamen = document.getElementById('btn-comenzar-examen');
        const seleccionado = this.value !== '';
        btnExamen.disabled = !seleccionado;
        
        // ========================================
        // SCROLL AL BOTÓN COMENZAR EXAMEN
        // ========================================
        if (seleccionado) {
            setTimeout(() => {
                btnExamen.scrollIntoView({ behavior: 'smooth', block: 'center' });
                btnExamen.style.transition = 'box-shadow 0.3s';
                btnExamen.style.boxShadow = '0 0 0 2px var(--azul)';
                setTimeout(() => {
                    btnExamen.style.boxShadow = '';
                }, 1000);
            }, 150);
        }
    });
}