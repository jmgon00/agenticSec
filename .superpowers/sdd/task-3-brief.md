# Task 3: Create Agentic IA Data Structure

**Files:**
- Create: `src/content/agentic-ia.ts`

**Interfaces:**
- Consumes: None
- Produces: `AGENTIC_IA_CONTENT` object with 5 tabs (Concepto, Para tu negocio, Mi metodología, Casos de uso, Pruébalo)

## Step 1: Define agentic IA content structure

Create `src/content/agentic-ia.ts`:

```typescript
export interface AgenticIATab {
  id: string;
  label: string;
  labelEs: string;
  content: string;
}

export const AGENTIC_IA_CONTENT: AgenticIATab[] = [
  {
    id: "concepto",
    label: "Concept",
    labelEs: "Concepto",
    content: `
## ¿Qué es Agentic IA?

Agentic IA se refiere a sistemas de inteligencia artificial que actúan de manera autónoma, tomando decisiones y ejecutando tareas sin intervención humana constante.

### Diferencia con IA Tradicional

- **IA Tradicional**: Responde a inputs, genera outputs. Requiere orquestación humana.
- **Agentic IA**: Define su propio plan, ejecuta tareas, se adapta a resultados, aprende del contexto.

### Características Clave

1. **Autonomía**: Toma decisiones sin esperar aprobación
2. **Persistencia**: Mantiene estado y contexto entre interacciones
3. **Adaptabilidad**: Se ajusta a cambios en el ambiente
4. **Razonamiento**: Planifica múltiples pasos para resolver problemas

Placeholder para secciones futuras con más detalle técnico...
    `.trim(),
  },
  {
    id: "para-tu-negocio",
    label: "For Your Business",
    labelEs: "Para tu negocio",
    content: `
## Por qué Agentic IA es importante para tu negocio

La automatización de procesos complejos puede ahorrar tiempo y recursos significativos.

### Beneficios

- **Eficiencia**: Automatiza procesos que toman horas
- **Escalabilidad**: Maneja volúmenes crecientes sin recursos adicionales
- **Consistencia**: Ejecuta tareas sin fatiga humana
- **Costo**: ROI alto en procesos repetitivos

### Casos de uso en Seguridad

- Monitoreo automático de vulnerabilidades
- Análisis de logs en tiempo real
- Generación de reportes de compliance
- Respuesta automática a incidentes

Placeholder para secciones futuras con más ejemplos...
    `.trim(),
  },
  {
    id: "metodologia",
    label: "My Methodology",
    labelEs: "Mi metodología",
    content: `
## Cómo implemento Agentic IA

Mi diferenciador es combinar IA con expertise en seguridad, asegurando que cada agente:

1. **Entiende el contexto de seguridad** de tu organización
2. **Respeta restricciones** y políticas existentes
3. **Proporciona auditoría completa** de sus acciones
4. **Se integra** con tus sistemas actuales

### Proceso

1. Análisis de procesos actuales
2. Diseño de agentes específicos
3. Integración con infraestructura
4. Testing exhaustivo
5. Monitoreo y optimización

Placeholder para secciones futuras con diagramas...
    `.trim(),
  },
  {
    id: "casos-de-uso",
    label: "Use Cases",
    labelEs: "Casos de uso",
    content: `
## Casos de uso concretos

### 1. Agente de Análisis de Logs
Monitorea logs de seguridad 24/7, identifica patrones anómalos, genera alertas.

**Impacto**: Reducción de MTTR (Mean Time To Respond) de horas a minutos.

### 2. Agente de Reportes
Genera reportes de compliance automáticamente según estándares ISO, PCI-DSS, etc.

**Impacto**: Ahorro de 80% del tiempo en reporte manual.

### 3. Agente de Reconocimiento
Realiza reconocimiento automático de infraestructura, documenta cambios.

**Impacto**: Visibilidad completamente actualizada de assets.

Placeholder para secciones futuras con más casos...
    `.trim(),
  },
  {
    id: "pruebalo",
    label: "Try It",
    labelEs: "Pruébalo",
    content: `
## Prueba Agentic IA

Aquí puedes interactuar con un demo del agente (próximamente).

### Demo: Agente de Análisis
Carga logs de ejemplo y ve cómo el agente analiza e identifica patrones.

[Placeholder para demo interactiva]

O mira un walkthrough completo del sistema en acción.

[Placeholder para video]
    `.trim(),
  },
];
```

## Step 2: Commit

```bash
git add src/content/agentic-ia.ts
git commit -m "feat: add Agentic IA content structure with 5 tabs"
```
