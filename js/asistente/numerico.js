// ============================================
// NUMERICO - Procesar opciones numéricas (1-6)
// ============================================

export function procesarOpcionNumerica(texto) {
    // Primero, validar que sea EXACTAMENTE un número del 1 al 6
    // sin palabras adicionales
    const numerosValidos = ['1', '2', '3', '4', '5', '6'];
    
    // Si el texto es exactamente un número válido
    if (numerosValidos.includes(texto)) {
        const numero = parseInt(texto);
        
        switch(numero) {
            case 1:
                return "📚 Te explico las pestañas:\n\n• **Estudio SIMO**: Información de convocatoria, normas y casos prácticos.\n• **Preguntas**: Exámenes de práctica con Modo Estudio y Modo Simulacro.\n• **Glosario**: Más de 140 términos clave.\n\n¿Quieres saber más sobre alguna pestaña en específico?";
            case 2:
                return "📚 El **Modo Estudio** es ideal para aprender:\n\n• Sin límite de tiempo\n• Puedes intentar hasta 4 veces por pregunta\n• Feedback inmediato con explicaciones\n• Al final, muestra la respuesta correcta\n\n¿Necesitas más detalles?";
            case 3:
                return "⏱️ El **Modo Simulacro** replica el examen real:\n\n• 5 minutos para 5 preguntas (tiempo total fijo)\n• Sin feedback durante el examen\n• Solo el primer intento cuenta para el puntaje\n• Puntaje = (aciertos ÷ 5) × 100\n• Corte de aprobación: 70/100\n\n¿Necesitas más detalles?";
            case 4:
                return "🔍 Para buscar:\n\n**En el Glosario:**\n• Escribe una palabra (mínimo 3 letras) y presiona Enter\n• Las coincidencias se resaltan en amarillo\n\n**En las Leyes:**\n• Ve a Estudio SIMO > Normas del sector salud\n• Escribe una palabra (ej: EPS) y presiona Enter\n• Haz clic en cualquier resultado para ver el artículo completo";
            case 5:
                return "⬆️ Para recuperar las pestañas ocultas:\n\n1️⃣ Mira en la esquina inferior derecha de la pantalla\n2️⃣ Busca el botón azul con una flecha ↑ que dice 'Subir'\n3️⃣ Haz clic en él\n\nLas pestañas volverán a aparecer y subirás al inicio.";
            case 6:
                return "⚙️ Para cambiar la configuración:\n\n1️⃣ Haz clic en el botón ⚙️ Ajustes (arriba a la derecha)\n2️⃣ Se abrirá una ventana con:\n\n• 🌙 **Modo oscuro**: Actívalo para estudiar de noche\n• 🔤 **Tamaño de letra**: Usa A- (disminuir) y A+ (aumentar)\n\nHay 4 tamaños: pequeña, normal, grande y extra grande.";
            default:
                return null;
        }
    }
    
    // Si no es un número exacto del 1 al 6, retornar null
    return null;
}