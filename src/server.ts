import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { setupSockets } from './sockets/connection';

dotenv.config();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // En producción, se restringe a tus dominios/IPs seguros
        methods: ["GET", "POST"]
    }
});

setupSockets(io);

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor Rider Backend (REST) corriendo en puerto ${PORT}`);
    console.log(`🔌 Motor de Sockets (Real-Time) inicializado exitosamente`);
});


// EXPORTACIÓN OBLIGATORIA PARA VERCEL
//export default httpServer;