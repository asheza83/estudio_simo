// ============================================
// RESPUESTAS - Función principal buscarRespuesta
// ============================================

import { getConocimientoData } from './datos.js';
import { limpiarTexto } from './limpiador.js';
import { procesarOpcionNumerica } from './numerico.js';
import { detectarIntencion } from './detector.js';
import { esAmbigua } from './ambiguo.js';
import { generarContrapregunta } from './contrapreguntas.js';

export function buscarRespuesta(pregunta) {
    const conocimientoData = getConocimientoData();
    
    if (!conocimientoData) return "Lo siento, aún no estoy listo. Intenta más tarde.";
    
    const textoOriginal = limpiarTexto(pregunta);
    
    // ========================================
    // CORRECTOR DE TIPOS COMUNES
    // ========================================
    const correcciones = {
        'simulacr': 'simulacro',
        'pregntas': 'preguntas',
        'resultads': 'resultados',
        'estdio': 'estudio',
        'glosrio': 'glosario',
        'puntje': 'puntaje'
    };
    
    let texto = textoOriginal;
    for (const [mal, bien] of Object.entries(correcciones)) {
        texto = texto.replace(new RegExp(mal, 'g'), bien);
    }
    
    // ========================================
    // RESPUESTAS DIRECTAS (MÁXIMA PRIORIDAD)
    // ========================================
    
    // ¿Cómo lo uso? - detecta cualquier variante
    if ((texto.includes('como') || texto.includes('cómo')) && 
        (texto.includes('usar') || texto.includes('uso') || texto.includes('utilizar'))) {
        return "📚 Para usar ESTUDIO SIMO...";
    }
    
    // ¿Dónde está lo de las preguntas? - detecta cualquier variante
    if ((texto.includes('donde') || texto.includes('dónde')) && 
        (texto.includes('pregunta') || texto.includes('preguntas') || texto.includes('examen'))) {
        return "📝 La pestaña **Preguntas** es donde realizas los exámenes. Está en la parte superior, junto a 'Estudio SIMO' y 'Glosario'. Allí puedes seleccionar el modo (Estudio o Simulacro), elegir competencia y comenzar el examen.";
    }
            
    // CNSC
    if (texto.includes('cnsc') && conocimientoData.concursoSIMO?.cnsc) {
        return conocimientoData.concursoSIMO.cnsc.definicion;
    }
    
    // SIMO (excluyendo "estudio simo" para no confundir)
    if (texto.includes('simo') && !texto.includes('estudio simo') && conocimientoData.concursoSIMO?.simo) {
        return conocimientoData.concursoSIMO.simo.definicion;
    }
    
    // OPEC
    if (texto.includes('opec')) {
        return "📋 **OPEC**: Oferta Pública de Empleo de Carrera. Es la vacante publicada en SIMO que representa un empleo público disponible en una entidad del Estado. Cada OPEC tiene requisitos específicos y un número de vacantes. ¿Te ayudo a entender cómo postularte?";
    }
    
    // Glosario (definición, no cómo usarlo)
    if (texto.includes('glosario') && conocimientoData.pestanas?.glosario) {
        return "📖 El **Glosario** es una de las 3 pestañas principales. Contiene más de 140 términos clave del SGSSS y salud mental, organizados en 5 categorías: siglas, entidades, términos, principios y carrera. Puedes buscar por palabra, filtrar por categoría o por letra inicial.";
    }
    
    // Simulacro (definición, no FAQ de error)
    if (texto.includes('simulacro') && conocimientoData.pestanas?.preguntas?.modos) {
        const modoSimulacro = conocimientoData.pestanas.preguntas.modos.find(m => m.nombre.includes('Simulacro'));
        if (modoSimulacro) {
            return `⏱️ **${modoSimulacro.nombre}**: ${modoSimulacro.descripcion}\n\n📌 **Características:**\n${modoSimulacro.caracteristicas.map(c => `• ${c}`).join('\n')}`;
        }
    }
    
    // Estudio (definición)
    if (texto.includes('estudio') && conocimientoData.pestanas?.preguntas?.modos) {
        const modoEstudio = conocimientoData.pestanas.preguntas.modos.find(m => m.nombre.includes('Estudio'));
        if (modoEstudio) {
            return `📚 **${modoEstudio.nombre}**: ${modoEstudio.descripcion}\n\n📌 **Características:**\n${modoEstudio.caracteristicas.map(c => `• ${c}`).join('\n')}`;
        }
    }
    
    // Puntaje / Resultados
    if ((texto.includes('puntaje') || texto.includes('puntajes')) && conocimientoData.resultados) {
        return `📊 ${conocimientoData.resultados.explicacion}\n\n📌 **Ejemplo:** ${conocimientoData.resultados.ejemplo}`;
    }
    
    if ((texto.includes('resultado') || texto.includes('resultados')) && conocimientoData.resultados) {
        return `📊 ${conocimientoData.resultados.explicacion}\n\n📌 **Ejemplo:** ${conocimientoData.resultados.ejemplo}\n\n📌 **Iconos en Modo Estudio:**\n• ✅ Acertó al primer intento\n• ⚠️ Acertó después de varios intentos\n• 🔴 Probó todas las opciones (requiere repaso)\n• ⏰ Tiempo agotado`;
    }
    
    // ========================================
    // 2. BUSCAR EN FAQ DEL JSON (CON PRECAUCIÓN)
    // ========================================
    if (conocimientoData.faqGeneral) {
        const palabrasEvitar = ['simo', 'glosario', 'simulacro', 'estudio', 'resultado', 'resultados', 'puntaje', 'puntajes'];
        
        for (const faq of conocimientoData.faqGeneral) {
            const preguntaLimpia = faq.pregunta.toLowerCase().replace(/[¿?]/g, '');
            
            let esPalabraEvitada = false;
            for (const ev of palabrasEvitar) {
                if (texto === ev || (texto.split(' ').length === 1 && texto.includes(ev))) {
                    esPalabraEvitada = true;
                    break;
                }
            }
            
            if (!esPalabraEvitada && (texto.includes(preguntaLimpia) || preguntaLimpia.includes(texto))) {
                return faq.respuesta;
            }
        }
    }
    
    // ========================================
    // 3. RESPUESTA GENERAL DE PESTAÑAS
    // ========================================
    if ((texto.includes('pestaña') || texto.includes('pestañas')) && conocimientoData.estructuraApp) {
        return `📌 La aplicación tiene ${conocimientoData.estructuraApp.pestanas.length} pestañas:\n\n` +
               conocimientoData.estructuraApp.pestanas.map(p => 
                   `${p.icono} **${p.nombre}**: ${p.descripcion}`
               ).join('\n\n');
    }
    
    // ========================================
    // 4. VERIFICAR SI ES RESPUESTA NUMÉRICA
    // ========================================
    const respuestaNumerica = procesarOpcionNumerica(texto);
    if (respuestaNumerica) return respuestaNumerica;
    
    // ========================================
    // 5. DETECTAR INTENCIÓN Y AMBIGÜEDAD
    // ========================================
    let intencion = detectarIntencion(texto);
    
    if (intencion === 'GENERICA') {
        if (esAmbigua(texto)) {
            const contrapregunta = generarContrapregunta(texto);
            if (contrapregunta) return contrapregunta;
        }
    }
    
    // ========================================
    // 6. RESPUESTAS SEGÚN INTENCIÓN (RESPALDO)
    // ========================================
    switch(intencion) {
        case 'INFO_PESTANAS':
            return "📌 La aplicación tiene **3 pestañas principales**:\n\n" +
                   "📚 **Estudio SIMO**: Información de convocatoria, normas del sector salud y casos prácticos.\n" +
                   "📝 **Preguntas**: Exámenes con Modo Estudio (aprender) y Modo Simulacro (entrenar velocidad).\n" +
                   "📖 **Glosario**: Más de 140 términos clave con buscador y filtros.\n\n" +
                   "¿Quieres más detalles sobre alguna pestaña en específico?";
        
        case 'PESTANA_ESPECIFICA':
            if (texto.includes('estudio simo')) {
                return "📚 La **pestaña Estudio SIMO** contiene información teórica: convocatoria ESE 2, normas del sector salud (Ley 100, Ley 1438) y casos prácticos. Tiene un selector con 4 opciones: Inicio, Convocatoria, Normas y Casos prácticos.";
            }
            if (texto.includes('preguntas')) {
                return "📝 La **pestaña Preguntas** es el corazón de la herramienta. Aquí evalúas tus conocimientos con 2 modos: 📚 Modo Estudio (aprender sin presión) y ⏱️ Modo Simulacro (entrenar velocidad). Puedes seleccionar entre 6 competencias diferentes.";
            }
            if (texto.includes('glosario')) {
                return "📖 La **pestaña Glosario** contiene más de 140 términos clave del SGSSS y salud mental. Puedes buscar por palabra, filtrar por categoría (siglas, entidades, términos, principios, carrera) o por letra inicial (A-Z).";
            }
            return "Las 3 pestañas principales son: Estudio SIMO (información teórica), Preguntas (exámenes) y Glosario (términos clave). ¿De cuál quieres más información?";
        
        case 'PREGUNTA_GENERICA':
            if (texto.includes('como lo uso') || texto.includes('cómo lo uso')) {
                return "📚 Para usar ESTUDIO SIMO:\n\n1️⃣ Explora las 3 pestañas en la parte superior\n2️⃣ En **Preguntas**, selecciona el modo (Estudio o Simulacro)\n3️⃣ Elige competencia y subcategoría\n4️⃣ Haz clic en COMENZAR EXAMEN\n5️⃣ Si tienes dudas, escribe 'ayuda' para ver el menú\n\n¿Quieres que te explique alguna parte en detalle?";
            }
            if (texto.includes('donde esta lo de las preguntas') || texto.includes('dónde está lo de las preguntas')) {
                return "📝 La pestaña **Preguntas** es donde realizas los exámenes. Está en la parte superior, junto a 'Estudio SIMO' y 'Glosario'. Allí puedes seleccionar el modo (Estudio o Simulacro), elegir competencia y comenzar el examen.";
            }
            if (texto.includes('que es esto') || texto.includes('qué es esto')) {
                return conocimientoData.introduccion?.descripcion || "📚 Esta es ESTUDIO SIMO, una herramienta de preparación para auxiliares de enfermería que buscan ingresar al Hospital Mental de Risaralda (HOMERIS) mediante el concurso ESE 2 de la CNSC.\n\nTiene 3 pestañas: Estudio SIMO (información), Preguntas (exámenes) y Glosario (términos). ¿Te ayudo con alguna en específico?";
            }
            if (texto.includes('para que sirve') || texto.includes('para qué sirve')) {
                return "📚 ESTUDIO SIMO sirve para prepararte para el concurso de méritos ESE 2. Puedes:\n\n• Informarte sobre la convocatoria\n• Practicar con preguntas (Modo Estudio o Simulacro)\n• Consultar términos en el Glosario\n\n¿Qué te gustaría hacer?";
            }
            if (texto.includes('cuanto dura') || texto.includes('cuánto dura')) {
                return "⏱️ ¿A qué te refieres? Si hablas del simulacro, dura 5 minutos para 5 preguntas. Si te refieres a otra cosa, por favor se más específico.";
            }
            if (texto.includes('que hago aqui') || texto.includes('qué hago aquí') || texto.includes('que tengo que hacer')) {
                return "📚 Aquí puedes prepararte para el concurso ESE 2. Te sugiero:\n\n1️⃣ Ve a la pestaña **Estudio SIMO** para informarte sobre la convocatoria y normas.\n2️⃣ Ve a la pestaña **Preguntas** para practicar con exámenes.\n3️⃣ Usa el **Glosario** para buscar términos que no entiendas.\n\n¿Por cuál quieres empezar?";
            }
            return "🤔 No entendí bien tu pregunta. Puedes:\n\n• Escribir **'ayuda'** para ver el menú de opciones\n• Preguntar algo más específico como '¿qué es el modo estudio?'\n• Consultar las instrucciones con el botón 📖\n\n¿Cómo puedo ayudarte mejor?";
        
        case 'INTRO_APP':
            return "📚 ESTUDIO SIMO es una herramienta gratuita de preparación para auxiliares de enfermería que buscan ingresar al Hospital Mental de Risaralda (HOMERIS) mediante el concurso de méritos ESE 2 de la CNSC. Tiene 3 pestañas: Estudio SIMO, Preguntas y Glosario.";
        
        case 'ESTRUCTURA_APP':
            return "📌 La aplicación tiene 3 pestañas:\n\n📚 **Estudio SIMO**: Convocatoria ESE 2, normas del sector salud (Ley 100, Ley 1438) y casos prácticos.\n📝 **Preguntas**: Modo Estudio y Modo Simulacro para evaluar tus conocimientos.\n📖 **Glosario**: Más de 140 términos clave con buscador y filtros.";
        
        case 'CNSC_SIMO':
            return "📋 **CNSC**: Comisión Nacional del Servicio Civil, órgano autónomo que administra los concursos de méritos.\n\n**SIMO**: Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad, plataforma tecnológica de la CNSC para concursos de méritos en empleos públicos de carrera administrativa.";
        
        case 'QUE_EVALUA_SIMO':
            return "📋 SIMO evalúa 6 competencias para auxiliares de enfermería:\n\n• 🧠 Razonamiento lógico\n• 🔢 Razonamiento matemático\n• 📖 Comprensión lectora\n• ⚖️ Ética profesional\n• 🤝 Trabajo en equipo\n• 🎯 Orientación al servicio";
        
        case 'RECUPERAR_PESTANAS':
            return "⬆️ Cuando te desplaces hacia abajo, las pestañas se ocultan. Usa el botón ↑ Subir (esquina inferior derecha) para recuperarlas. Si cambias de pestaña durante un examen, el sistema guarda tu progreso automáticamente.";
        
        case 'GLOSARIO':
            return "📖 El glosario tiene más de 140 términos. Para buscar, escribe una palabra (mínimo 3 letras) y presiona Enter. Las coincidencias se resaltan en amarillo. También puedes filtrar por categoría (siglas, entidades, términos, principios, carrera).";
        
        case 'MODO_ESTUDIO':
            if (texto.includes('icono') || texto.includes('chulito') || texto.includes('triangulito') || texto.includes('círculo')) {
                return "📊 Los iconos en Modo Estudio significan:\n\n✅ **Chulito verde**: Acertaste al primer intento\n⚠️ **Triángulo amarillo**: Acertaste después de varios intentos (aprendizaje)\n🔴 **Círculo rojo**: Probaste todas las opciones (requiere repaso)\n⏰ **Reloj**: Tiempo agotado";
            }
            return "📚 Modo Estudio: Sin límite de tiempo, feedback inmediato, puedes intentar hasta 4 veces por pregunta. Ideal para aprender.";
        
        case 'MODO_SIMULACRO':
            if (texto.includes('barra') || texto.includes('color')) {
                return "📊 La barra de tiempo del simulacro cambia de color según el tiempo restante:\n\n🟢 **Verde**: más del 50% tiempo\n🟡 **Amarillo**: entre 20% y 50%\n🔴 **Rojo**: menos del 20%\n\nLos últimos 5 segundos parpadean en rojo.";
            }
            if (texto.includes('puntaje') || texto.includes('cálculo') || texto.includes('corte')) {
                return "📊 Puntaje = (Aciertos al primer intento ÷ Total preguntas) × 100. Corte de aprobación: 70/100. Ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ.";
            }
            return "⏱️ Modo Simulacro: 5 minutos fijos para 5 preguntas, sin feedback durante el examen. Solo el primer intento cuenta. Puntaje = (aciertos ÷ 5) × 100. Corte de aprobación: 70/100.";
        
        case 'BUSCAR_LEYES':
            if (texto.includes('ley 100') || texto.includes('artículo')) {
                return "🔍 Para buscar un artículo en la Ley 100: Ve a Estudio SIMO > Normas del sector salud. Selecciona 'Ley 100 de 1993'. Usa el buscador dentro de la ley o haz clic en los artículos relevantes listados.";
            }
            if (texto.includes('dónde') || texto.includes('ubicado')) {
                return "🔍 El buscador de leyes está en: Estudio SIMO > Normas del sector salud. Allí encontrarás un buscador universal. Escribe una palabra (ej: EPS, afiliación) y presiona Enter.";
            }
            return "🔍 Para buscar en leyes: Ve a Estudio SIMO > Normas del sector salud. Escribe una palabra (ej: EPS, artículo 157) y presiona Enter. Haz clic en cualquier resultado para ver el artículo completo.";
        
        case 'AJUSTES':
            return "⚙️ Botón Ajustes (arriba a la derecha):\n\n🌙 **Modo oscuro**: Actívalo para estudiar de noche\n🔤 **Tamaño de letra**: 4 tamaños (pequeña, normal, grande, extra grande) con botones A- y A+";
        
        case 'CONVOCATORIA':
            if (texto.includes('vacantes') || texto.includes('cuántas')) {
                return "📋 Convocatoria ESE 2: 2.477 vacantes en 72 ESE del país. Modalidades: ascenso general (184), ascenso discapacidad (3), abierto general (2.293), abierto discapacidad (194).";
            }
            if (texto.includes('inscribirme') || texto.includes('cómo')) {
                return "📋 Para inscribirte: 1) Crear perfil en SIMO, 2) Buscar la vacante, 3) Pagar el PIN (aproximadamente $43.350 nivel técnico/asistencial), 4) Formalizar la aspiración.";
            }
            return "📋 Convocatoria ESE 2: Inscripciones en julio-agosto 2026. 2.477 vacantes en 72 ESE. Modalidades: ascenso general (184), ascenso discapacidad (3), abierto general (2.293), abierto discapacidad (194).";
        
        case 'RESULTADOS':
            if (texto.includes('fondo verde')) {
                return "📊 El fondo verde en los resultados significa que la respuesta fue correcta al primer intento. En Modo Estudio, el fondo verde aparece en la tabla de resultados cuando acertaste.";
            }
            if (texto.includes('fondo rojo')) {
                return "📊 El fondo rojo en los resultados significa que la respuesta fue incorrecta o que el tiempo se agotó. En Modo Estudio, se muestra la respuesta correcta debajo.";
            }
            return "📊 Puntaje = (Aciertos al primer intento ÷ Total preguntas) × 100. Corte de aprobación: 70/100. Ejemplo: 4 aciertos de 5 = 80/100 → APROBÓ.";
        
        case 'CASOS_PRACTICOS':
            if (texto.includes('filtros')) {
                return "🩺 Los casos prácticos tienen filtros por competencia: TODAS, Básicas (lógica, matemáticas, lectura crítica), Funcionales (normas), Comportamentales (ética, trabajo en equipo, orientación al servicio). Paginación: 10 casos por página.";
            }
            return "🩺 Los casos prácticos son situaciones reales que podrías enfrentar en HOMERIS. Clasificados por competencia (básicas, funcionales, comportamentales) con respuestas orientativas desplegables. Tienen paginación de 10 casos por página.";
        
        case 'GUARDAR_PROGRESO':
            return "💾 Si cambias de pestaña durante un examen, el sistema guarda automáticamente tu avance (pregunta actual, respuestas seleccionadas, intentos). Al volver, puedes continuar donde lo dejaste.";
        
        case 'CANCELAR_EXAMEN':
            return "❌ El botón Cancelar examen (rojo) borra todo el progreso de la prueba actual y vuelve a la pantalla de selección de competencias.";
        
        case 'PERIODO_PRUEBA':
            return "📋 El período de prueba es de seis meses después del nombramiento. Durante este tiempo, la entidad evalúa tu desempeño real en el puesto. Solo después de superarlo, eres considerado empleado de carrera con todos los derechos de estabilidad.";
        
        case 'DIFERENCIA_SIMO_MAESTRO':
            return "📋 **SIMO**: CNSC - concursos de carrera administrativa, requiere pago de PIN, genera derechos de carrera.\n\n**Sistema Maestro**: Ministerio de Educación - solo para docentes, gratuito, nombramiento provisional, no genera derechos de carrera.";
        
        case 'QUE_ES_OPEC':
            return "📋 OPEC (Oferta Pública de Empleo de Carrera) es la vacante publicada en SIMO para concursos de méritos. Representa un empleo público disponible en una entidad del Estado.";
        
        case 'BOTON_INSTRUCCIONES':
            return "📖 El botón Instrucciones (📖) abre el modal de bienvenida, donde se explica el funcionamiento de la aplicación. También aparece automáticamente la primera vez que ingresas.";
        
        case 'PALABRA_SUELTA':
            if (texto.includes('cnsc')) {
                return "📋 **CNSC**: Comisión Nacional del Servicio Civil. Es el órgano autónomo que administra los concursos de méritos para empleos públicos de carrera administrativa en Colombia. ¿Quieres saber más sobre su función o sobre la convocatoria ESE 2?";
            }
            if (texto.includes('simo')) {
                return "📋 **SIMO**: Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad. Es la plataforma tecnológica de la CNSC para concursos de méritos. A través de SIMO puedes buscar vacantes, inscribirte y consultar resultados. ¿Necesitas ayuda con algo específico?";
            }
            if (texto.includes('opec')) {
                return "📋 **OPEC**: Oferta Pública de Empleo de Carrera. Es la vacante publicada en SIMO que representa un empleo público disponible en una entidad del Estado. Cada OPEC tiene requisitos específicos y un número de vacantes. ¿Te ayudo a entender cómo postularte?";
            }
            if (texto.includes('glosario')) {
                return "📖 El **Glosario** es una de las 3 pestañas principales. Contiene más de 140 términos clave del SGSSS y salud mental, organizados en 5 categorías. Puedes buscar por palabra, filtrar por categoría o por letra inicial. ¿Quieres saber cómo usar el buscador?";
            }
            if (texto.includes('simulacros')) {
                return "⏱️ El **Modo Simulacro** está en la pestaña Preguntas. Simula las condiciones reales del examen: 5 minutos para 5 preguntas, sin feedback durante la prueba, y al final obtienes un puntaje SIMO sobre 100. El corte de aprobación es 70/100. ¿Quieres más detalles?";
            }
            if (texto.includes('simulacro')) {
                return "⏱️ El **Modo Simulacro** está en la pestaña Preguntas. Simula las condiciones reales del examen: 5 minutos para 5 preguntas, sin feedback durante la prueba, y al final obtienes un puntaje SIMO sobre 100. El corte de aprobación es 70/100. ¿Quieres más detalles?";
            }
            if (texto.includes('estudio')) {
                return "📚 El **Modo Estudio** está en la pestaña Preguntas. Es ideal para aprender sin presión: sin límite de tiempo, puedes intentar hasta 4 veces por pregunta, y recibes feedback inmediato con explicaciones. ¿Necesitas saber más?";
            }
            if (texto.includes('puntajes')) {
                return "📊 El **puntaje SIMO** se calcula como: (Aciertos al primer intento ÷ Total de preguntas) × 100. El corte de aprobación es 70/100. Por ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ. ¿Quieres que te explique más?";
            }
            if (texto.includes('puntaje')) {
                return "📊 El **puntaje SIMO** se calcula como: (Aciertos al primer intento ÷ Total de preguntas) × 100. El corte de aprobación es 70/100. Por ejemplo: 4 aciertos de 5 = (4÷5)×100 = 80/100 → APROBÓ. ¿Quieres que te explique más?";
            }
            if (texto.includes('resultados')) {
                return "📊 Los **resultados** del examen muestran: puntaje total, aciertos vs total, y si APROBÓ o REPROBÓ. En Modo Estudio también se muestran iconos (✅, ⚠️, 🔴). ¿Necesitas más detalles?";
            }
            if (texto.includes('resultado')) {
                return "📊 Los **resultados** del examen muestran: puntaje total, aciertos vs total, y si APROBÓ o REPROBÓ. En Modo Estudio también se muestran iconos (✅, ⚠️, 🔴). ¿Necesitas más detalles?";
            }
            if (texto.includes('homeria') || texto.includes('homeris')) {
                return "🏥 **HOMERIS** (Hospital Mental de Risaralda) es la ESE especializada en salud mental donde muchos auxiliares de enfermería buscan ingresar mediante el concurso ESE 2 de la CNSC. ¿Necesitas información sobre los requisitos específicos?";
            }
            return "📌 No entendí bien qué palabra clave me escribiste. Las palabras que reconozco son: CNSC, SIMO, OPEC, glosario, simulacro, estudio, puntaje, resultados. ¿Puedes escribir una de ellas?";
        
        default:
            return "No encontré una respuesta exacta. Puedes consultar las instrucciones (📖) o usar el menú de ayuda escribiendo 'ayuda'.";
    }
}