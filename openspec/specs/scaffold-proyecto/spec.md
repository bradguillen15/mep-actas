# scaffold-proyecto Specification

## Purpose
Define la estructura base del proyecto Next.js, sus herramientas y convenciones.

## Requirements

### Requirement: Proyecto Next.js con App Router y TypeScript
El proyecto SHALL usar Next.js con App Router y TypeScript en modo estricto. El renderizado SHALL ser del lado del cliente (sin SSR). El layout raíz SHALL usar `"use client"`.

#### Scenario: El proyecto compila sin errores
- **WHEN** se ejecuta `npx tsc --noEmit`
- **THEN** no se reportan errores de tipos

#### Scenario: El layout marca use client
- **WHEN** se inspecciona `app/layout.tsx`
- **THEN** la primera línea es `"use client"`

### Requirement: Tokens de diseño de identidad MEP
Los colores institucionales del MEP SHALL definirse como variables CSS en `app/globals.css`. Los componentes SHALL usar estas variables, nunca valores hex embebidos.

#### Scenario: Las variables CSS de la paleta MEP están definidas
- **WHEN** se inspecciona `app/globals.css`
- **THEN** existen las variables `--color-primario`, `--color-primario-hover`, `--color-acento`, `--color-acento-suave`, `--color-fondo`, `--color-superficie`, `--color-borde`, `--color-texto`, `--color-exito`, `--color-error`

#### Scenario: Los valores hex coinciden con el BRD §9.3
- **WHEN** se leen las variables CSS
- **THEN** `--color-primario` es `#0B3C8C`, `--color-acento` es `#D4A017`, `--color-error` es `#C0392B`, `--color-exito` es `#1E7E45`

### Requirement: Configuración de Tailwind con la paleta MEP
Tailwind SHALL extender su tema con los colores MEP como tokens con nombre, mapeando a las variables CSS.

#### Scenario: Tailwind tiene los colores MEP configurados
- **WHEN** se inspecciona `tailwind.config.ts`
- **THEN** existe una sección `theme.extend.colors` con `primario`, `acento`, `exito`, `error`

### Requirement: Vitest configurado para pruebas unitarias
Vitest SHALL estar configurado con entorno jsdom y node, con soporte para TypeScript y JSX.

#### Scenario: Vitest ejecuta una prueba básica
- **WHEN** se ejecuta `npx vitest run`
- **THEN** las pruebas existentes pasan
