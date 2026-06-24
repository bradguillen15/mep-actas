import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import path from "path";

const DB_PATH = process.env.TURSO_DATABASE_URL
  ? process.env.TURSO_DATABASE_URL.replace(/^file:/, "")
  : path.resolve(__dirname, "../mep-actas-local.db");

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../drizzle") });

  const { rows: roles } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM roles`
  );
  const cntRoles = Number(roles?.[0]?.cnt ?? 0);

  if (cntRoles === 0) {
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin País', 1)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin Regional', 2)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin Escuela', 3)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Staff', 4)`);
    console.log("  roles insertados");
  }

  const { rows: regiones } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM regiones`
  );
  const cntRegiones = Number(regiones?.[0]?.cnt ?? 0);

  if (cntRegiones === 0) {
    await db.run(
      sql`INSERT INTO regiones (nombre) VALUES ('Región Central'), ('Región Chorotega'), ('Región Pacífico Central'), ('Región Brunca'), ('Región Huetar Caribe'), ('Región Huetar Norte')`
    );
    console.log("  regiones insertadas");
  }

  const { rows: tipos } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM tipos_acta`
  );
  const cntTipos = Number(tipos?.[0]?.cnt ?? 0);

  if (cntTipos === 0) {
    await db.run(
      sql`INSERT INTO tipos_acta (nombre) VALUES ('Certificado de Graduación'), ('Acta de Notas'), ('Traslado'), ('Convalidación')`
    );
    console.log("  tipos de acta insertados");
  }

  const { rows: personas } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM personas`
  );
  const cntPersonas = Number(personas?.[0]?.cnt ?? 0);

  if (cntPersonas === 0) {
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('111111111', 'Admin', 'País')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('222222222', 'Admin', 'Regional')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('333333333', 'Admin', 'Escuela')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('444444444', 'Staff', 'General')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('101230001', 'Juan', 'Pérez López')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('101230002', 'María', 'González Ruiz')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('101230003', 'Carlos', 'Mendoza Solano')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('101230004', 'Ana', 'Cordero Víquez')`
    );
    console.log("  personas insertadas");
  }

  const { rows: escuelas } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM escuelas`
  );
  const cntEscuelas = Number(escuelas?.[0]?.cnt ?? 0);

  if (cntEscuelas === 0) {
    await db.run(
      sql`INSERT INTO escuelas (region_id, codigo_mep, nombre) VALUES (1, '001', 'Escuela Central')`
    );
    await db.run(
      sql`INSERT INTO escuelas (region_id, codigo_mep, nombre) VALUES (1, '002', 'Liceo Experimental')`
    );
    await db.run(
      sql`INSERT INTO escuelas (region_id, codigo_mep, nombre) VALUES (2, '101', 'Colegio Chorotega')`
    );
    console.log("  escuelas insertadas");
  }

  const { rows: funcionarios } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM funcionarios`
  );
  const cntFuncionarios = Number(funcionarios?.[0]?.cnt ?? 0);

  if (cntFuncionarios === 0) {
    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (1, 'Director Nacional')`
    );
    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (2, 'Director Regional')`
    );
    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (3, 'Director Escuela')`
    );
    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (4, 'Asistente')`
    );
    await db.run(
      sql`INSERT INTO funcionario_escuela (funcionario_id, escuela_id) VALUES (1, 1)`
    );
    await db.run(
      sql`INSERT INTO funcionario_escuela (funcionario_id, escuela_id) VALUES (2, 2)`
    );
    await db.run(
      sql`INSERT INTO funcionario_escuela (funcionario_id, escuela_id) VALUES (3, 1)`
    );
    await db.run(
      sql`INSERT INTO funcionario_escuela (funcionario_id, escuela_id) VALUES (4, 1)`
    );
    console.log("  funcionarios insertados");
  }

  const { rows: usuarios } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM usuarios`
  );
  const cntUsuarios = Number(usuarios?.[0]?.cnt ?? 0);

  if (cntUsuarios === 0) {
    const ph = hashSync("password", 10);
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (1, 1, 'admin@pais.local', ${ph})`
    );
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (2, 2, 'admin@regional.local', ${ph})`
    );
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (3, 3, 'admin@escuela.local', ${ph})`
    );
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (4, 4, 'staff@local', ${ph})`
    );
    console.log("  usuarios insertados");
  }

  client.close();
  console.log(`\nBase de datos local lista: ${DB_PATH}`);
  console.log("Usuarios disponibles:");
  console.log("  admin@pais.local     / password  (Admin País, nivel 1)");
  console.log("  admin@regional.local / password  (Admin Regional, nivel 2, región 1)");
  console.log("  admin@escuela.local  / password  (Admin Escuela, nivel 3, escuela 1)");
  console.log("  staff@local          / password  (Staff, nivel 4, escuela 1)");
}

main().catch((err) => {
  console.error("Error al inicializar la base de datos local:", err);
  process.exit(1);
});
