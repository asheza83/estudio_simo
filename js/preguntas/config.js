// ============================================
// CONFIG - Configuración de preguntas
// ============================================

// Configuración de subcategorías por tipo de competencia
export const subcategoriasConfig = {
    funcionales: [
        { id: "ley100", nombre: "📄 Ley 100 de 1993" },
        { id: "ley1438", nombre: "📄 Ley 1438 de 2011" },
        { id: "ley1122", nombre: "📄 Ley 1122 de 2007" },
        { id: "ley1751", nombre: "📄 Ley 1751 de 2015" },
        { id: "decreto780", nombre: "📄 Decreto 780 de 2016" },
        { id: "decreto1011", nombre: "📄 Decreto 1011 de 2006" },
        { id: "resolucion2292", nombre: "📄 Resolución 2292 de 2021" },
        { id: "resolucion3100", nombre: "📄 Resolución 3100 de 2019" },
        { id: "resolucion3280", nombre: "📄 Resolución 3280 de 2018" },
        { id: "resolucion1995", nombre: "📄 Resolución 1995 de 1999" },
        { id: "resolucion1444", nombre: "📄 Resolución 1444 de 2025" },
        { id: "resolucion256", nombre: "📄 Resolución 256 de 2016" }
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
    ],
    simulacro: [
        { id: "simulacro", nombre: "🎯 SIMULACRO COMPLETO (150 preguntas)" }
    ]
};

// Mapa de rutas de archivos
export const rutasArchivos = {
    // Funcionales
    ley100: "funcionales/ley100.json",
    ley1438: "funcionales/ley1438.json",
    ley1122: "funcionales/ley1122.json",
    ley1751: "funcionales/ley1751.json",
    decreto780: "funcionales/decreto780.json",
    decreto1011: "funcionales/decreto1011.json",
    resolucion2292: "funcionales/resolucion2292.json",
    resolucion3100: "funcionales/resolucion3100.json",
    resolucion3280: "funcionales/resolucion3280.json",
    resolucion1995: "funcionales/resolucion1995.json",
    resolucion1444: "funcionales/resolucion1444.json",
    resolucion256: "funcionales/resolucion256.json",
    // Básicas
    logicas: "basicas/logicas.json",
    matematicas: "basicas/matematicas.json",
    lecturacritica: "basicas/lectura-critica.json",
    // Comportamentales
    etica: "comportamentales/etica.json",
    orientacionservicio: "comportamentales/orientacion-servicio.json",
    trabajoequipo: "comportamentales/trabajo-equipo.json",
    // SIMULACRO
    simulacro: "simulacro.json"
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
    // Funcionales
    ley100: "Ley 100 de 1993",
    ley1438: "Ley 1438 de 2011",
    ley1122: "Ley 1122 de 2007",
    ley1751: "Ley 1751 de 2015",
    decreto780: "Decreto 780 de 2016",
    decreto1011: "Decreto 1011 de 2006",
    resolucion2292: "Resolución 2292 de 2021",
    resolucion3100: "Resolución 3100 de 2019",
    resolucion3280: "Resolución 3280 de 2018",
    resolucion1995: "Resolución 1995 de 1999",
    resolucion1444: "Resolución 1444 de 2025",
    resolucion256: "Resolución 256 de 2016",
    // Básicas
    logicas: "Razonamiento lógico",
    lecturacritica: "Lectura Crítica",
    matematicas: "Matemáticas aplicadas",
    // Comportamentales
    etica: "Ética profesional",
    orientacionservicio: "Orientación al Servicio",
    trabajoequipo: "Trabajo en Equipo"
};