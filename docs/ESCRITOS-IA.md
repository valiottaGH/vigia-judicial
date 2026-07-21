# Generar escritos con IA

## Requisito

Agrega en `.env.local`:

```env
OPENAI_API_KEY=sk-...
# Opcional:
OPENAI_MODEL=gpt-4o-mini
```

Obtene la key en https://platform.openai.com/api-keys

## Uso en la app

### Al crear un escrito

1. `/dashboard/escritos/nuevo` → elegi tipo de escrito
2. Pestaña **Generar con IA** → describe el caso (hechos, partes, pedido)
3. Click **Generar borrador con IA** → revisa el preview
4. Click **Crear escrito con borrador IA**

### En un escrito existente

1. Abrí el escrito en el editor
2. Panel lateral **Generar con IA**
3. Escribi instrucciones (ej. "Ampliar fundamentos de derecho")
4. **Regenerar contenido** — reemplaza el cuerpo (titulo se mantiene)

## Como funciona (tecnico)

- Endpoint: `POST /api/escritos/generate`
- Usa tu membrete de `/dashboard/configuracion`
- La IA devuelve HTML (`<p>`, `<strong>`) compatible con el editor
- **Siempre revisa** el texto antes de presentar — es borrador asistido, no asesoramiento legal automatico

## Costos

Cada generacion consume tokens de tu cuenta OpenAI (centavos con `gpt-4o-mini`).

## Sin API key

Si no configuras `OPENAI_API_KEY`, las plantillas estaticas siguen funcionando;
solo se oculta el boton de IA.
