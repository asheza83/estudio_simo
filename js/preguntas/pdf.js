// ============================================
// PDF - Exportar resultados a PDF (solo simulacro)
// ============================================

import { 
    preguntasActuales, respuestasUsuario,
    modoSimulacro, variablesEvaluacion
} from '../estado.js';

import { getFiltroLeyActual } from './inicio.js';
import { getTiempoUsadoSegundos } from './resumen.js';
import { nombresPDF } from './config.js';

export function exportarResultadosPDF() {
    if (!modoSimulacro) return;
    
    console.log("=== INICIO EXPORTAR PDF ===");
    
    // ========================================
    // INDICADOR DE CARGA (Punto 6)
    // ========================================
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'pdf-loading';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; min-width: 250px;">
                <div style="font-size: 3rem;">⏳</div>
                <p style="margin-top: 15px; font-size: 1.2rem; font-weight: bold;">Generando PDF...</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 5px;">Puede tomar hasta 30 segundos</p>
                <div style="margin-top: 15px; width: 100%; background: #e0e0e0; border-radius: 5px; overflow: hidden;">
                    <div style="width: 0%; height: 4px; background: #0d6efd; border-radius: 5px;" id="pdf-progress-bar"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // Actualizar barra de progreso (simulación visual)
    const progressBar = document.getElementById('pdf-progress-bar');
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += 10;
            if (progressBar) progressBar.style.width = progress + '%';
        }
    }, 2000);
    
    // Datos del examen
    const totalPreguntas = preguntasActuales.length;
    const aciertos = respuestasUsuario.filter(r => r.esCorrecta === true).length;
    const puntajeFinal = Math.round((aciertos / totalPreguntas) * 100);
    const aprobo = puntajeFinal >= 70;
    
    // Nombre competencia (ya no se usa para el nombre del archivo)
    const filtroLeyActual = getFiltroLeyActual();
    let nombreCompetencia = nombresPDF[filtroLeyActual] || filtroLeyActual;
    
    // Tiempos
    const tiempoUsadoSegundos = getTiempoUsadoSegundos();
    const tiempoTotalConfigurado = variablesEvaluacion.tiempoTotal || (100 * 60);
    const minutosUsados = Math.floor(tiempoUsadoSegundos / 60);
    const segundosUsados = tiempoUsadoSegundos % 60;
    const minutosTotal = Math.floor(tiempoTotalConfigurado / 60);
    const segundosTotal = tiempoTotalConfigurado % 60;
    const tiempoPromedioCalc = (tiempoUsadoSegundos / totalPreguntas).toFixed(1);
    
    // Fecha para el nombre del archivo (YYYY-MM-DD)
    const ahora = new Date();
    const fechaNombre = ahora.toISOString().split('T')[0]; // 2026-05-08
    const fechaStr = ahora.toLocaleDateString('es-CO');
    const horaStr = ahora.toLocaleTimeString('es-CO');
    
    // Construir contenido HTML de preguntas falladas (solo las necesarias)
    let falladasHtml = '';
    let falladasCount = 0;
    
    for (let idx = 0; idx < preguntasActuales.length; idx++) {
        const pregunta = preguntasActuales[idx];
        const respuesta = respuestasUsuario[idx];
        const esCorrecta = respuesta.esCorrecta === true;
        if (esCorrecta) continue;
        falladasCount++;
        
        const textoRespuesta = respuesta.respuestaFinal || 'No respondida';
        let textoCorrecto = '';
        let explicacionCorrecta = pregunta.explicacionCorrecta || 'No disponible';
        
        if (respuesta.opcionesMostradas) {
            const opcionCorrecta = respuesta.opcionesMostradas.find(o => o.esCorrecta === true);
            if (opcionCorrecta) textoCorrecto = opcionCorrecta.texto;
        }
        
        falladasHtml += `
            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <strong>Pregunta ${idx + 1}:</strong> ${pregunta.texto}<br>
                <strong>Tu respuesta:</strong> ${textoRespuesta}<br>
                <strong>Respuesta correcta:</strong> ${textoCorrecto}<br>
                <strong>Explicación:</strong> ${explicacionCorrecta}
            </div>
        `;
    }
    
    if (falladasCount === 0) {
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
                <h3>📋 PREGUNTAS FALLADAS (${falladasCount})</h3>
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
    
    // Función para limpiar y eliminar indicador
    const limpiarIndicador = () => {
        clearInterval(progressInterval);
        const loadingDivEliminar = document.getElementById('pdf-loading');
        if (loadingDivEliminar) loadingDivEliminar.remove();
    };
    
    // Usar onload del iframe para garantizar que el contenido esté listo
    iframe.onload = () => {
        setTimeout(() => {
            html2canvas(iframe.contentDocument.body, {
                scale: 1.5,  // Optimizado: 1.5 en lugar de 2 (más rápido)
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
                
                // PUNTO 5: Nombre del PDF corregido (sin competencia)
                pdf.save(`simulacro_${fechaNombre}.pdf`);
                
                // ========================================
                // MENSAJE DE ÉXITO PARA EL USUARIO
                // ========================================
                const successMsg = document.createElement('div');
                successMsg.id = 'pdf-success-msg';
                successMsg.innerHTML = `
                    <div style="position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10001; font-size: 0.9rem; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                        ✅ PDF descargado exitosamente. Revisa la carpeta de Descargas.
                    </div>
                `;
                document.body.appendChild(successMsg);
                
                // Eliminar el mensaje después de 3 segundos
                setTimeout(() => {
                    const msg = document.getElementById('pdf-success-msg');
                    if (msg) msg.remove();
                }, 4000);
                
                document.body.removeChild(iframe);
                limpiarIndicador();
                console.log("✅ PDF generado exitosamente");
            }).catch(err => {
                console.error("❌ Error con html2canvas:", err);
                document.body.removeChild(iframe);
                limpiarIndicador();
            });
        }, 300);
    };
    
    // Si el iframe ya está cargado, ejecutar manualmente
    if (iframe.contentDocument.readyState === 'complete') {
        iframe.onload();
    }
}

// Exponer función global para onclick
window.exportarResultadosPDF = exportarResultadosPDF;