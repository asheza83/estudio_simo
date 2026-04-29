// ============================================
// MÓDULO: ajustes.js
// Modo oscuro, tamaño de letra, modal configuración
// ============================================

import { modoOscuro, tamañoLetraActual, tamañosLetra, setModoOscuro, setTamañoLetraActual } from './estado.js';

// ============================================
// MODO OSCURO
// ============================================
export function actualizarColorBotonAjustes() {
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        if (document.body.classList.contains('dark-mode')) {
            configBtn.style.color = 'white';
        } else {
            configBtn.style.color = '';
        }
    }
}

export function toggleModoOscuro() {
    const nuevoModo = !modoOscuro;
    setModoOscuro(nuevoModo);
    if (nuevoModo) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('simoModoOscuro', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('simoModoOscuro', 'false');
    }
    actualizarTextoBotonModoOscuro();
    actualizarColorBotonAjustes();
}

export function cargarModoOscuro() {
    const guardado = localStorage.getItem('simoModoOscuro');
    if (guardado === 'true') {
        setModoOscuro(true);
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    actualizarTextoBotonModoOscuro();
    actualizarColorBotonAjustes();
}

export function actualizarTextoBotonModoOscuro() {
    const modalDarkModeBtn = document.getElementById('modalDarkModeToggle');
    if (modalDarkModeBtn) {
        modalDarkModeBtn.textContent = modoOscuro ? '☀️ Desactivar' : '🌙 Activar';
    }
}

// ============================================
// TAMAÑO DE LETRA
// ============================================
export function cargarTamañoLetra() {
    const guardado = localStorage.getItem('simoTamañoLetra');
    if (guardado && tamañosLetra.includes(guardado)) {
        setTamañoLetraActual(guardado);
        document.body.classList.add(tamañoLetraActual);
    } else {
        document.body.classList.add('font-normal');
    }
}

export function cambiarTamañoLetra(direccion) {
    const idxActual = tamañosLetra.indexOf(tamañoLetraActual);
    let nuevoIdx = idxActual + direccion;
    
    if (nuevoIdx >= 0 && nuevoIdx < tamañosLetra.length) {
        document.body.classList.remove(tamañoLetraActual);
        setTamañoLetraActual(tamañosLetra[nuevoIdx]);
        document.body.classList.add(tamañoLetraActual);
        localStorage.setItem('simoTamañoLetra', tamañoLetraActual);
    }
}

// ============================================
// CONFIGURACIÓN (Modal)
// ============================================
export function initConfiguracion() {
    const modal = document.getElementById('configModal');
    const configBtn = document.getElementById('configBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const modalDarkModeBtn = document.getElementById('modalDarkModeToggle');
    const modalFontDecrease = document.getElementById('modalFontDecrease');
    const modalFontIncrease = document.getElementById('modalFontIncrease');
    
    if (!configBtn || !modal) return;
    
    configBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    if (modalDarkModeBtn) {
        modalDarkModeBtn.addEventListener('click', () => {
            toggleModoOscuro();
        });
    }
    
    if (modalFontDecrease) {
        modalFontDecrease.addEventListener('click', () => {
            cambiarTamañoLetra(-1);
        });
    }
    
    if (modalFontIncrease) {
        modalFontIncrease.addEventListener('click', () => {
            cambiarTamañoLetra(1);
        });
    }
}