import app from './app';
import dotenv from 'dotenv';

dotenv.config();

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`🚀 Servidor Rider Backend corriendo en el puerto ${PORT}`);
// });

// EXPORTACIÓN OBLIGATORIA PARA VERCEL
export default app;