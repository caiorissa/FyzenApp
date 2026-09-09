# Fyzen 2.0

Fyzen é um fitness OS pessoal: conhece a rotina, organiza o plano, registra cada série, preserva o histórico e transforma dados em próximos passos claros. Continua em React 18 + Vite + Tailwind + Firebase Auth/Firestore, sem migração de framework ou banco.

## O que mudou na 2.0

- Modo Treino dedicado, pensado para uma mão: carga, repetições, atalhos de peso e descanso por timestamp.
- Sessões versionadas com autosave local e sincronização idempotente no Firestore; um refresh não perde uma série já registrada.
- Histórico compatível: ao encerrar uma sessão detalhada, o resumo também permanece em `historicoTreino/{uid}/registros` para os recursos existentes.
- Cálculos determinísticos de volume, e1RM (Epley, apenas até 12 reps), PRs e sugestão de progressão; IA interpreta, não calcula.
- Home mobile-first, aba Fyzen AI contextual e Progresso enriquecido quando há sessões detalhadas.

Consulte [modelo de dados](docs/DATA-MODEL.md), [arquitetura da IA](docs/AI-ARCHITECTURE.md) e [direção mobile](docs/FRONTEND-DESIGN.md).

## Desenvolvimento

```sh
npm ci
npm run dev
```

O servidor usa `http://127.0.0.1:5173`. Se a porta estiver ocupada, use `npm run dev -- --port 5174`.

O arquivo `.env.local` existente é necessário para os serviços reais. A configuração usa `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`, além das opções Firebase já configuradas. As integrações existentes usam `VITE_AI_WORKOUT_API_URL`, `VITE_AI_SERVER_URL` e `VITE_ADMIN_EMAIL`. Não comite credenciais.

## Validação

```sh
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm test
```

O projeto é JavaScript/JSX, sem configuração TypeScript. ESLint verifica referências, JSX e regras de hooks; Vite valida a compilação.

Os testes abrem um servidor separado na porta 5175 com `vite.test.config.js`. Firebase é substituído **somente nesse servidor** por fixtures em `tests/fixtures`. Pagamento e geração de treino são interceptados nos cenários correspondentes. Não são realizadas operações em contas ou assinaturas reais. O servidor normal e o build de produção continuam usando as integrações existentes.

## Interface

- Navegação principal fixa no desktop; quatro destinos frequentes e menu “Mais” no mobile.
- Entrada, cadastro, recuperação e verificação de e-mail.
- Home com atalhos para ações reais e sequência de treinos.
- Perfil de treino recolhível, checklist, personalização, geração e relatório semanal.
- Diário alimentar, metas, progresso, painel Ultra, planos, checkout, assinatura e administração.
- Diálogos nativos com teclado e foco, feedback de salvamento, estados vazios e redução de movimento.

## Dados e segurança

Variáveis existentes são preservadas: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_AI_WORKOUT_API_URL`, `VITE_AI_SERVER_URL` e `VITE_ADMIN_EMAIL`. Não há chave de LLM no browser. As regras versionadas em [firestore.rules](firestore.rules) incluem a proteção de `workoutSessions` por usuário.

Tokens e componentes estão em `src/components/index.css`, `tailwind.config.js` e `src/components`. As telas são carregadas sob demanda. A navegação mantém os identificadores existentes em `App.jsx`.

Consulte [a direção de design](docs/FRONTEND-DESIGN.md) e [o relatório de validação](docs/QA-REDESIGN.md). Capturas com dados fictícios estão em `docs/qa/`.
