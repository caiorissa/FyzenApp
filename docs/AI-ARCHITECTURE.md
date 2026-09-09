# Arquitetura de IA — Fyzen 2.0

## Contratos preservados

`src/lib/aiWorkoutService.js` continua usando somente os contratos existentes:

- `POST ${VITE_AI_WORKOUT_API_URL}/workout/week`
- `POST ${VITE_AI_WORKOUT_API_URL}/workout/day`

Os endpoints continuam opcionais: se a geração falhar, o plano determinístico existente é usado.

## Coach e adaptação

O coach atual constrói uma leitura local a partir de sessões concluídas, séries, carga, repetições e volume. Isso oferece uma resposta útil sem inventar um endpoint de chat nem expor uma chave de modelo no frontend. Um backend futuro pode receber um resumo mínimo criado por `buildFitnessContext(profile, plan, recentSessions, trends, recovery)`; nunca os documentos brutos completos por padrão.

Progressão é determinística: duas sessões no topo da faixa de repetições, com todas as séries prescritas, sugerem um incremento configurável (2,5 kg por padrão). A sugestão é explicada e nunca altera o plano sem escolha explícita do usuário.

## Segurança e fallback

- Volume, PR, consistência, duração e e1RM são calculados no cliente.
- e1RM usa Epley até 12 repetições e é explicitamente uma estimativa.
- Respostas de IA futuras precisam de schema/limites antes de serem exibidas ou aplicadas.
- Dor aguda, persistente ou forte não deve receber recomendação de continuar treinando; Fyzen não diagnostica nem prescreve tratamento.
