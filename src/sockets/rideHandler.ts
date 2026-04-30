import { Server, Socket } from 'socket.io';

export const handleRideEvents = (io: Server, socket: Socket) => {

    // 1. ESCUCHAR: La pasajera pide un viaje
    socket.on('request_ride', (data) => {
        const user = socket.data.user;

        console.log(`🚀 Viaje solicitado por: ${user.name} (${data.rideType})`);

        // Estructuramos la oferta para las conductoras
        const rideOffer = {
            rideId: `RIDE-${Math.random().toString(36).toUpperCase().substr(2, 7)}`,
            passenger: {
                id: user.id,
                name: user.name,
                rating: 4.9, // Mock por ahora
                phone: user.phone
            },
            origin: data.origin,
            destination: data.destination,
            rideType: data.rideType,
            estimatedPrice: 0, // Aquí podrías recalcular si quieres seguridad extra
        };

        // ENVIAR: Solo a las conductoras que están en la sala 'drivers_room'
        // Usamos broadcast para que NO le llegue a la pasajera que lo pidió
        socket.to('drivers_room').emit('new_ride_available', rideOffer);

        console.log(`📢 Oferta enviada a la sala de conductoras.`);
    });

    // 2. ESCUCHAR: La conductora acepta el viaje
    socket.on('accept_ride', (data) => {
        const driver = socket.data.user;
        const { rideId, passengerId } = data;

        console.log(`✅ Viaje ${rideId} aceptado por la conductora ${driver.name}`);

        // Generamos el PIN de seguridad de 4 dígitos
        const securityPIN = Math.floor(1000 + Math.random() * 9000).toString();

        // NOTIFICAR A LA PASAJERA: Le enviamos los datos de la conductora y el PIN
        io.to(passengerId).emit('ride_accepted', {
            rideId,
            pin: securityPIN,
            driver: {
                name: driver.name,
                vehiclePlates: driver.vehicle_plates || "ABC-123", // Lo que tengas en la BD
                rating: 5.0,
                photoUrl: "https://via.placeholder.com/150"
            }
        });

        // Sacamos a la conductora de la sala de ofertas para que no le lleguen más mientras viaja
        socket.leave('drivers_room');
    });
};