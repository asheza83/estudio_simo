// ============================================
// CONFIG - Configuración de preguntas
// ============================================

// Configuración de subcategorías por tipo de competencia
export const subcategoriasConfig = {
    funcionales: [
        { id: "ley100", nombre: "📄 Ley 100 de 1993" },
        { id: "ley1438", nombre: "📄 Ley 1438 de 2011" }
    ],
    basicas: [
        { id: "logicas", nombre: "🧠 Razonamiento lógico" },
        { id: "matematicas", nombre: "🔢 Matemáticas aplicadas" },
        { id: "lecturacritica", nombre: "📖 Lectura crítica" }
    ],
    comportamentales: [
        { id: "etica", nombre: "⚖️ Ética profesional" },
        { id: "trabajoequipo", nombre: "🤝 Trabajo en equipo" },
        { id: "orientacionservicio", nombre: "🎯 Orientación al servicio" }
    ]
};

// Mapa de rutas de archivos
export const rutasArchivos = {
    // Funcionales
    ley100: "funcionales/ley100.json",
    ley1438: "funcionales/ley1438.json",
    // Básicas
    logicas: "basicas/logicas.json",
    matematicas: "basicas/matematicas.json",
    lecturacritica: "basicas/lectura-critica.json",
    // Comportamentales
    etica: "comportamentales/etica.json",
    orientacionservicio: "comportamentales/orientacion-servicio.json",
    trabajoequipo: "comportamentales/trabajo-equipo.json"
};

// Nombres legibles para competencias
export const nombresCompetencias = {
    // Básicas
    logicas: "Razonamiento lógico",
    lecturacritica: "Lectura Crítica",
    matematicas: "Matemáticas aplicadas",
    // Comportamentales
    etica: "Ética profesional",
    orientacionservicio: "Orientación al Servicio",
    trabajoequipo: "Trabajo en Equipo"
};

// Nombres para PDF
export const nombresPDF = {
    ley100: "Ley 100 de 1993",
    ley1438: "Ley 1438 de 2011",
    logicas: "Razonamiento lógico",
    lecturacritica: "Lectura Crítica",
    matematicas: "Matemáticas aplicadas",
    etica: "Ética profesional",
    orientacionservicio: "Orientación al Servicio",
    trabajoequipo: "Trabajo en Equipo"
};