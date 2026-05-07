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
            subcategoriaSelect.innerHTML = '<option value="">Selecciona una subcategoría...</option>';
            subcategoriasConfig[tipo].forEach(sub => {
                subcategoriaSelect.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
            });
            subcategoriaSelect.style.display = 'block';
            subcategoriaSelect.disabled = false;
            btnExamen.disabled = true;
        } else {
            subcategoriaSelect.style.display = 'none';
            subcategoriaSelect.disabled = true;
            btnExamen.disabled = true;
        }
    });
    
    subcategoriaSelect.addEventListener('change', function() {
        const btnExamen = document.getElementById('btn-comenzar-examen');
        btnExamen.disabled = (this.value === '');
        
        // Scroll al botón COMENZAR EXAMEN cuando se habilita (en móvil)
        if (!btnExamen.disabled && window.innerWidth <= 768) {
            setTimeout(() => {
                btnExamen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });
}