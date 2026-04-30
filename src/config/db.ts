import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el Pool de conexiones
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Máximo 10 conexiones concurrentes (ajústalo según la RAM de tu servidor)
    queueLimit: 0
});

// Función autoejecutable solo para probar que la conexión funciona al levantar el server
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('🟢 Conexión a MySQL (rider_app) establecida con éxito.');
        connection.release(); // Siempre debemos liberar la conexión al pool
    } catch (error) {
        console.error('🔴 Error conectando a MySQL:', error);
    }
})();