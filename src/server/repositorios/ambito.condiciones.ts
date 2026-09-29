import { eq, inArray, sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { escuelas } from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";

export function condicionEscuelaEnAmbito(
  ambito: AmbitoConsulta,
  columnaEscuelaId: SQLiteColumn
): SQL | undefined {
  switch (ambito.tipo) {
    case "pais":
      return undefined;
    case "region":
      return inArray(
        columnaEscuelaId,
        sql`(select ${escuelas.id} from ${escuelas} where ${escuelas.regionId} = ${ambito.regionId})`
      );
    case "escuela":
      return eq(columnaEscuelaId, ambito.escuelaId);
    case "ninguno":
      return sql`0 = 1`;
  }
}
