import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleRideEvents } from './rideHandler';

export const setupSockets = (io: Server) => {

    // 🛡️ Middleware de Sockets (El Cadenero)
    io.use((socket, next) => {
        // Obtenemos el token que el Frontend envía en socketInstance.connect(token)
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Autenticación denegada: Token faltante'));
        }

        try {
            // Validamos la firma del JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

            // Inyectamos el usuario en la sesión del socket para usarlo en los handlers
            socket.data.user = decoded;
            next();
        } catch (error) {
            next(new Error('Autenticación denegada: Token inválido'));
        }
    });

    // 🟢 Evento Principal: Cuando alguien pasa el filtro y se conecta
    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        console.log(`🟢 Conexión Socket exitosa [ID: ${socket.id} | Rol: ${user.role}]`);

        // Unimos al usuario a una "sala" que se llama exactamente como su UUID de la BD.
        // Esto evita que le enviemos los datos del viaje de María a la app de Patricia.
        socket.join(user.userId);

        // Delegamos los eventos de pedir viaje a nuestro handler
        handleRideEvents(io, socket);

        // 🔴 Evento: Cuando pierden señal o cierran la app
        socket.on('disconnect', (reason) => {
            console.log(`🔴 Socket Desconectado [ID: ${socket.id} | Razón: ${reason}]`);
            // Aquí en el futuro, si es conductora, limpiaremos su ubicación en Redis
        });
    });
};