/**
 * Obtiene el customerId de la cuenta MiCorreo para cargarlo en el .env
 *
 * Uso:
 *   node scripts/getCustomerId.js
 *   node scripts/getCustomerId.js tu-email@dominio.com tuPassword
 *
 * Requiere que USER_TOKEN y PASSWORD_TOKEN ya estén cargados en el .env.
 * El email y la contraseña son los de tu cuenta de MiCorreo (los del registro
 * en correoargentino.com.ar), NO los tokens de la API.
 */
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const isProd = process.env.CORREO_ARGENTINO_ENV === 'production';
const baseURL = isProd
  ? 'https://api.correoargentino.com.ar'
  : 'https://apitest.correoargentino.com.ar';

/** Pregunta por consola. Si es una contraseña, oculta lo que se tipea. */
const ask = (question, hidden = false) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    if (hidden) {
      // Interceptamos la salida para que no se vea la contraseña
      const onData = (char) => {
        if (['\n', '\r', ''].includes(char.toString())) {
          process.stdin.removeListener('data', onData);
        } else {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(question);
        }
      };
      process.stdin.on('data', onData);
    }

    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
};

const getToken = async () => {
  const userToken = process.env.USER_TOKEN;
  const passwordToken = process.env.PASSWORD_TOKEN;

  if (!userToken || !passwordToken || userToken === 'tu_user_token') {
    throw new Error(
      'Falta cargar USER_TOKEN y PASSWORD_TOKEN en el .env. Son las credenciales que te envía Correo Argentino por mail.'
    );
  }

  const authHeader = 'Basic ' + Buffer.from(`${userToken}:${passwordToken}`).toString('base64');

  const response = await fetch(`${baseURL}/micorreo/v1/token`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401) {
      throw new Error(
        `Credenciales rechazadas (401). Verificá que USER_TOKEN y PASSWORD_TOKEN correspondan al ambiente "${isProd ? 'production' : 'test'}".`
      );
    }
    throw new Error(`No se pudo obtener el token (HTTP ${response.status}): ${detail}`);
  }

  const data = await response.json();
  if (!data?.token) throw new Error('La respuesta de /token no incluyó el campo "token".');

  return data;
};

const getCustomerId = async (token, email, password) => {
  const response = await fetch(`${baseURL}/micorreo/v1/users/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 404) {
      throw new Error(
        'No existe una cuenta MiCorreo con ese email en este ambiente. Ojo: la cuenta de test y la de producción son distintas.'
      );
    }
    throw new Error(`Falló la validación del usuario (HTTP ${response.status}): ${detail}`);
  }

  const data = await response.json();
  if (!data?.customerId) throw new Error('La respuesta de /users/validate no incluyó "customerId".');

  return data;
};

const main = async () => {
  console.log(`\n🔎 Ambiente: ${isProd ? 'PRODUCCIÓN' : 'TEST'} (${baseURL})\n`);

  const email = process.argv[2] || (await ask('Email de tu cuenta MiCorreo: '));
  const password = process.argv[3] || (await ask('Contraseña de MiCorreo: ', true));

  if (!email || !password) {
    console.error('\n❌ Necesito el email y la contraseña de tu cuenta MiCorreo.\n');
    process.exit(1);
  }

  console.log('\n⏳ Pidiendo token de autorización...');
  const { token, expires } = await getToken();
  console.log(`✅ Token obtenido${expires ? ` (vence: ${expires})` : ''}`);

  console.log('⏳ Validando usuario para obtener el customerId...');
  const { customerId, createdAt } = await getCustomerId(token, email, password);

  console.log(`\n✅ Listo. Cuenta creada el ${createdAt || 's/d'}\n`);
  console.log('   Pegá esta línea en tu backend/.env:\n');
  console.log(`   CUSTOMER_ID=${customerId}\n`);
};

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});
