// ============================================
// MÓDULO: utils.js
// Funciones auxiliares globales
// ============================================

export function mostrarError(mensaje) {
    const container = document.getElementById('contenido-ley');
    if (container) {
        container.innerHTML = `<div class="feedback feedback-error" style="padding: 20px; text-align: center;">❌ ${mensaje}</div>`;
    } else {
        console.error(mensaje);
    }
}