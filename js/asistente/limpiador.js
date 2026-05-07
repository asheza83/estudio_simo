// ============================================
// LIMPIADOR - Limpieza de texto
// ============================================

export function limpiarTexto(texto) {
    // Palabras vacías que SÍ se pueden eliminar
    const palabrasVacias = [
        'de', 'la', 'con', 'y', 'el', 'los', 'las', 'un', 'una',
        'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante',
        'en', 'entre', 'hacia', 'hasta', 'mediante', 'según', 'sin',
        'so', 'sobre', 'tras', 'vs', 'vía', 'mi', 'tu', 'su', 'nuestro',
        'me', 'te', 'al', 'del', 'puedo', 'puede', 'puedes', 'quiero',
        'saber', 'decir', 'hacer'
    ];
    
    // Palabras clave que NUNCA deben eliminarse
    const palabrasClave = [
        'que', 'qué', 'como', 'cómo', 'para', 'por', 'es', 'son', 'está', 'están',
        'ser', 'sido', 'se', 'lo', 'le', 'les', 'os', 'nos', 'cual', 'cuál',
        'donde', 'dónde', 'cuando', 'cuándo', 'quien', 'quién'
    ];
    
    let limpio = texto.toLowerCase()
        .replace(/[¿?¡!.,;:()]/g, '')
        .replace(/[áä]/g, 'a')
        .replace(/[éë]/g, 'e')
        .replace(/[íï]/g, 'i')
        .replace(/[óö]/g, 'o')
        .replace(/[úü]/g, 'u');
    
    const palabras = limpio.split(/\s+/);
    
    // Filtrar: eliminar solo palabras vacías que NO son clave
    const filtradas = palabras.filter(p => {
        // Conservar palabras clave aunque estén en palabrasVacias
        if (palabrasClave.includes(p)) return true;
        // Eliminar palabras vacías
        if (palabrasVacias.includes(p)) return false;
        // Conservar palabras con longitud > 1
        return p.length > 1;
    });
    
    return filtradas.join(' ');
}