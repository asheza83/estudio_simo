// ============================================
// DATOS - Carga del conocimiento JSON
// ============================================

let conocimientoData = null;

export async function cargarConocimiento() {
    try {
        const response = await fetch('datos/ia-conocimiento.json');
        conocimientoData = await response.json();
        console.log('✅ Asistente IA: conocimiento cargado');
    } catch (error) {
        console.error('❌ Error cargando conocimiento:', error);
    }
}

export function getConocimientoData() {
    return conocimientoData;
}