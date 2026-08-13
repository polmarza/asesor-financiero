# Backlog de mejoras

<!-- Ideas de mejora que no entran en el sprint actual pero que no queremos perder.
     No es un compromiso, es un repositorio de ideas.
     Añadir una entrada cada vez que surja una idea durante el desarrollo. -->

---

## Formato de entrada

```
### [MEJORA-XX] Título de la idea
**Área:** Frontend / Backend / UX / Infraestructura / Negocio
**Prioridad estimada:** Alta / Media / Baja
**Origen:** De dónde salió la idea (conversación, feedback de usuario, etc.)

Descripción breve de la mejora y por qué aportaría valor.
```

---

### [MEJORA-01] Invitación directa a un cliente concreto
**Área:** Backend / UX
**Prioridad estimada:** Baja
**Origen:** Descartado al pasar a entrada pública

Permitir que la asesora genere un enlace de entrevista para alguien con quien
ya está hablando, sin que esa persona pase por la landing. Era el diseño
inicial del producto y se descartó porque, como **único** camino de entrada,
hacía que la aplicación no sirviera de nada hasta tener un cliente. Como opción
secundaria sigue teniendo sentido.

### [MEJORA-02] Envío del plan por correo
**Área:** Backend
**Prioridad estimada:** Media
**Origen:** El correo ya se captura, pero hoy solo identifica al lead

Enviar al cliente su plan por correo al terminar, y avisar a la asesora cuando
entra un lead nuevo.

### [MEJORA-03] Verificación del correo
**Área:** Backend
**Prioridad estimada:** Baja
**Origen:** Riesgo de leads basura en el flujo público

Hoy el correo se acepta sin comprobar. Verificarlo mejoraría la calidad de los
leads, a cambio de meter fricción en mitad de una conversación que presume
justamente de no tenerla. Medir antes de decidir.

### [MEJORA-04] Capturar explícitamente si el gasto incluye las cuotas de deuda
**Área:** Backend / Criterio
**Prioridad estimada:** Media
**Origen:** Verificación de la Fase 7 (diagnóstico)

El caso C1 de `docs/criterio/instrucciones-motor.md` («¿gasto_total_mes
incluye las cuotas de deuda?») se resuelve hoy comparando
`aportacion_mensual_actual` con `ingresos − gasto`: si no coinciden, se asume
que el gasto NO incluye las cuotas (R9, prudente) y se restan aparte. En la
práctica esto puede restar dos veces una cuota que el cliente ya dijo que
tenía metida en su gasto total (como pasó en la verificación con la ficha de
Laura), simplemente porque su aportación mensual no coincide con el
remanente — algo habitual, ya que lo que aparta cada mes no tiene por qué
casar con lo que le sobra.

La plantilla de entrevista no pregunta esto de forma explícita. Añadir una
pregunta corta en el bloque 3 o 6 («¿ese gasto ya cuenta la cuota de la
hipoteca/deudas, o va aparte?») y una clave nueva en la ficha eliminaría la
ambigüedad en el origen, en vez de heredarla al motor.
