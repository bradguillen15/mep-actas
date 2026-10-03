import { ejecutarSemillaLocal } from "../src/db/semilla/local";
import { PASSWORD_LOCAL } from "../src/db/semilla/sembrar";

const reiniciar = process.argv.includes("--reiniciar");

async function main() {
  const resultado = await ejecutarSemillaLocal({
    urlBaseDeDatos: process.env.TURSO_DATABASE_URL,
    reiniciar,
  });

  console.log(
    `Base de datos local ${reiniciar ? "reiniciada y " : ""}lista: ${resultado.rutaBaseDeDatos}`
  );
  console.log(`Imágenes de escaneos generadas: ${resultado.imagenesGeneradas}`);
  console.log(`Usuarios disponibles (contraseña: ${PASSWORD_LOCAL}):`);
  for (const usuario of resultado.usuarios) {
    console.log(
      `  ${usuario.email.padEnd(34)} ${usuario.rol} (nivel ${usuario.nivel}) - ${usuario.ambito}`
    );
  }
}

main().catch((error: unknown) => {
  console.error(
    "No se pudo sembrar la base de datos local:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
