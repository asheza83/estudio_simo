// ============================================
// MÓDULO: navegacion.js
// Navegación entre pestañas y menú hamburguesa
// ============================================

import { mostrarGlosario } from './glosario.js';

export function cambiarPestana(pestanaId) {
    // Quitar active de todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Quitar active de todos los botones
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activar el contenido seleccionado
    document.getElementById(pestanaId).classList.add('active');
    
    // Activar el botón correspondiente a la pestaña
    const botones = document.querySelectorAll('.tab-button');
    botones.forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes(pestanaId)) {
            btn.classList.add('active');
        }
    });
    
    // Cargar glosario si es necesario
    if (pestanaId === 'tab-glosario') {
        if (typeof mostrarGlosario === 'function') {
            mostrarGlosario();
        }
    }
}

export function irAPreguntas() {
    cambiarPestana('tab-preguntas');
}

// Ocultar header al hacer scroll
let lastScrollTop = 0;
const header = document.querySelector('.header');
const tabs = document.querySelector('.tabs');

if (header && tabs) {
    window.addEventListener('scroll', function() {
        let scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollThreshold = 50;
        
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            header.classList.add('hide');
            tabs.classList.add('hide');
        } else if (scrollTop < lastScrollTop || scrollTop <= scrollThreshold) {
            header.classList.remove('hide');
            tabs.classList.remove('hide');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}