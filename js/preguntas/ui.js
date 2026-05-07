// ============================================
// UI - Ocultar/Mostrar contenido descriptivo
// ============================================

export function ocultarContenidoDescriptivo() {
    const descripcionPrueba = document.getElementById('descripcion-prueba');
    const infoTest = document.getElementById('info-test');
    if (descripcionPrueba) descripcionPrueba.style.display = 'none';
    if (infoTest) infoTest.style.display = 'none';
}

export function restaurarContenidoDescriptivo() {
    const descripcionPrueba = document.getElementById('descripcion-prueba');
    const infoTest = document.getElementById('info-test');
    if (descripcionPrueba) descripcionPrueba.style.display = 'block';
    if (infoTest) infoTest.style.display = 'block';
}