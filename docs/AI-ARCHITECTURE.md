# Arquitetura de IA — Fyzen 2.0

## Contratos preservados

`src/lib/aiWorkoutService.js` continua usando somente os contratos existentes:

- `POST ${VITE_AI_WORKOUT_API_URL}/workout/week`
- `POST ${VITE_AI_WORKOUT_API_URL}/workout/day`

Os endpoints continuam opcionais: se a geração falhar, o plano determinístico existente é usado.

## Exercícios principais e regeneração diária

- A IA recebe o catálogo fechado de exercícios de `docs/EXERCISE-VIDEO-CATALOG.md`, filtrado pelo local do treino, e pode selecionar no máximo cinco por grupo.
- A resposta é filtrada no cliente para aceitar apenas exercícios do catálogo e compatíveis com o grupo muscular e o local escolhidos; quando a IA devolve menos do que foi pedido, a lista é completada com opções compatíveis ainda não usadas.
- Na regeneração de um dia, os grupos e a ordem atuais são enviados como fixos. O cliente mantém os nomes desses grupos e rejeita a resposta se ela trocar o foco muscular do dia.
- O gerador determinístico também escolhe somente exercícios principais do catálogo.

## Coach e adaptação

O coach envia mensagens para `POST ${VITE_AI_WORKOUT_API_URL}/coach/chat`, implementado em `fyzenbackend/coachRoutes.js`. O backend valida o token Firebase, busca apenas as sessões concluídas do próprio usuário, reduz o contexto a exercícios e séries e limita o histórico da conversa. O modelo é o mesmo cliente OpenRouter/OpenAI do gerador de treinos; chaves permanecem no servidor. Quando o serviço estiver indisponível, a tela informa o erro em vez de fingir que uma resposta local é generativa.

Progressão é determinística: duas sessões no topo da faixa de repetições, com todas as séries prescritas, sugerem um incremento configurável (2,5 kg por padrão). A sugestão é explicada e nunca altera o plano sem escolha explícita do usuário.

## Segurança e fallback

- Volume, PR, consistência, duração e e1RM são calculados no cliente.
- e1RM usa Epley até 12 repetições e é explicitamente uma estimativa.
- Respostas de IA futuras precisam de schema/limites antes de serem exibidas ou aplicadas.
- Dor aguda, persistente ou forte não deve receber recomendação de continuar treinando; Fyzen não diagnostica nem prescreve tratamento.

## Plano alimentar semanal

- A Nutrição chama `POST ${VITE_AI_WORKOUT_API_URL}/meal/weekly-plan` com token Firebase Bearer e somente alergias, restrições, preferências e indicação explícita de necessidade clínica. O UID vem do token; perfil, análise, meta calórica e treino são carregados do documento `planos/{uid}` no backend.
- A rota usa `fyzenbackend/aiWeeklyMealRoutes.js` e o mesmo `aiClient.js`/OpenRouter já configurado. A rota legada `/meal/generate` e a coleção `meal_plans` permanecem intactas.
- O contexto dos dias usa os grupos e exercícios de `plan.treinos`, na mesma ordem útil usada por `PlanScreen`; dias sem treino salvo são descanso. `nutrition.total` é a meta existente e não é recalculada.
- O backend e o cliente validam a resposta de sete dias, 3–6 refeições por dia, alimentos, porções aproximadas e estimativas limitadas. Alergias declaradas e restrições conhecidas são limites obrigatórios. Falha da IA, JSON inválido ou resposta que viola uma restrição retorna erro sem fallback inventado.
- Menores de 18 anos e declarações de necessidade clínica/terapêutica recebem orientação para buscar um profissional. IMC é somente informativo; a Fyzen AI não é apresentada como profissional de saúde.
- Preferências e sugestão ficam em `planos/{uid}.nutrition.preferenciasPlanoSemanal` e `planos/{uid}.nutrition.planoSemanal`. Edições de alimentos/porções são salvas sem recalcular as estimativas originais. Geração e edição não criam entradas em `nutrition/{uid}/days/{data}`.
