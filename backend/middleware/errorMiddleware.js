const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    friendlyMessage: getFriendlyMessage(statusCode, err.message),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const getFriendlyMessage = (status, originalMessage) => {
  if (status === 404) return '¡Uy! No pudimos encontrar lo que buscabas. Tal vez se dio a la fuga 🏃💨';
  if (status === 400) return 'Parece que algo no cuadra en la información que nos enviaste. ¿Podrías revisarla? ✨';
  if (status === 401) return '¡Epa! Necesitas permiso para entrar aquí. ¿Ya iniciaste sesión? 🔑';
  return '¡Ups! Algo salió mal en nuestros servidores. Estamos trabajando para arreglarlo lo antes posible 🛠️';
};

export { errorHandler };
