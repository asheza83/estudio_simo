// ============================================
// PDF - Exportar resultados a PDF (solo simulacro)
// ============================================

import { 
    preguntasActuales, respuestasUsuario,
    modoSimulacro, PREGUNTAS_POR_SESION
} from '../estado.js';

import { getFiltroLeyActual } from './inicio.js';
import { getTiempoUsadoSegundos } from './resumen.js';
import { nombresPDF } from './config.js';

export function exportarResultadosPDF() {
    if (!modoSimulacro) return;
    
    console.log("=== INICIO EXPORTAR PDF ===");
    
    // Datos del examen
    const totalPreguntas = preguntasActuales.length;
    const aciertos = respuestasUsuario.filter(r => r.esCorrecta === true).length;
    const puntajeFinal = Math.round((aciertos / totalPreguntas) * 100);
    const aprobo = puntajeFinal >= 70;
    
    // Nombre competencia
    const filtroLeyActual = getFiltroLeyActual();
    let nombreCompetencia = nombresPDF[filtroLeyActual] || filtroLeyActual;
    
    // Tiempos
    const tiempoUsadoSegundos = getTiempoUsadoSegundos();
    const tiempoTotalConfigurado = PREGUNTAS_POR_SESION * 60;
    const minutosUsados = Math.floor(tiempoUsadoSegundos / 60);
    const segundosUsados = tiempoUsadoSegundos % 60;
    const minutosTotal = Math.floor(tiempoTotalConfigurado / 60);
    const segundosTotal = tiempoTotalConfigurado % 60;
    const tiempoPromedioCalc = (tiempoUsadoSegundos / totalPreguntas).toFixed(1);
    
    // Fecha
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-CO');
    const horaStr = ahora.toLocaleTimeString('es-CO');
    
    // Construir contenido HTML de preguntas falladas
    let falladasHtml = '';
    for (let idx = 0; idx < preguntasActuales.length; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        const esCorrecta = respuesta.esCorrecta === true;
        if (esCorrecta) continue;
        const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
        let textoCorrecto = '';
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            if (opcionCorrecta) textoCorrecto = opcionCorrecta.texto;
        }
        falladasHtml += `
            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <strong>Pregunta ${idx + 1}:</strong> ${pregunta.texto}<br>
                <strong>Tu respuesta:</strong> ${textoRespuesta}<br>
                <strong>Respuesta correcta:</strong> ${textoCorrecto}
            </div>
        `;
    }
    
    if (falladasHtml === '') {
        falladasHtml = '<p style="text-align: center;">🎉 ¡Excelente! No tuviste preguntas falladas.</p>';
    }
    
    const contenidoHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0d6efd;">ESTUDIO SIMO</h1>
                <h2>📊 RESULTADO SIMULACRO SIMO</h2>
                <p><strong>Fecha:</strong> ${fechaStr} - ${horaStr}</p>
                <p><strong>Competencia:</strong> ${nombreCompetencia}</p>
            </div>
            
            <div style="background-color: ${aprobo ? '#d4edda' : '#f8d7da'}; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2.5rem; font-weight: bold;">${puntajeFinal}% (${puntajeFinal}/100)</div>
                <div style="font-size: 1.2rem; margin-top: 10px;">✅ Aciertos: ${aciertos} de ${totalPreguntas} (${Math.round((aciertos/totalPreguntas)*100)}%)</div>
                <div style="font-size: 1rem;">🎯 Corte de aprobación: 70/100</div>
                <div style="font-size: 1.3rem; font-weight: bold; margin-top: 10px; color: ${aprobo ? 'green' : 'red'};">${aprobo ? '🟢 APROBÓ' : '🔴 REPROBÓ'}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>⏱️ TIEMPOS</h3>
                <p>Tiempo total: ${minutosUsados.toString().padStart(2,'0')}:${segundosUsados.toString().padStart(2,'0')} / ${minutosTotal.toString().padStart(2,'0')}:${segundosTotal.toString().padStart(2,'0')}</p>
                <p>Tiempo promedio por pregunta: ${tiempoPromedioCalc} segundos</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>📋 PREGUNTAS FALLADAS</h3>
                ${falladasHtml}
            </div>
            
            <div style="margin-top: 20px; font-size: 11px; text-align: center; color: #666;">
                <p>ESTUDIO SIMO - Preparación para el concurso ESE 2 | HOMERIS</p>
                <p>https://estudio-simo.netlify.app/</p>
            </div>
        </div>
    `;
    
    // Crear un iframe oculto para renderizar el PDF
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.width = '800';
    iframe.height = '600';
    document.body.appendChild(iframe);
    
    // Escribir el contenido en el iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(contenidoHTML);
    iframe.contentDocument.close();
    
    setTimeout(() => {
        html2canvas(iframe.contentDocument.body, {
            scale: 2,
            logging: false,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            });
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`Simulacro_${nombreCompetencia.replace(/ /g, '_')}_${fechaStr.replace(/\//g, '-')}.pdf`);
            document.body.removeChild(iframe);
            console.log("✅ PDF generado exitosamente");
        }).catch(err => {
            console.error("❌ Error con html2canvas:", err);
            document.body.removeChild(iframe);
        });
    }, 500);
}

// Exponer función global para onclick
window.exportarResultadosPDF = exportarResultadosPDF;