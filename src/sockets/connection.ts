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

        // 1. Unirse a su sala personal (basado en el ID de la base de datos)
        // Nota: Asegúrate si es user.userId o user.id según tu JWT
        socket.join(user.userId);

        // 2. Si es Conductora, unirla al gremio de conductoras disponibles
        if (user.role === 'driver') {
            socket.join('drivers_room');
            console.log(`🚕 Conductora ${user.id} entró a la sala de ofertas.`);
        }

        // 3. Delegamos el resto de la lógica de viajes
        handleRideEvents(io, socket);

        socket.on('disconnect', (reason) => {
            console.log(`🔴 Desconectado: ${user.id} | Razón: ${reason}`);
        });
    });
};