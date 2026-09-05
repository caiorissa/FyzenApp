# Fyzen

Aplicação pessoal de treino, alimentação e acompanhamento de atividade. React 18, Vite, Tailwind, Firebase Auth/Firestore, Lucide e Framer Motion.

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

Tokens e componentes estão em `src/components/index.css`, `tailwind.config.js` e `src/components`. As telas são carregadas sob demanda. A navegação mantém os identificadores existentes em `App.jsx`.

Consulte [a direção de design](docs/FRONTEND-DESIGN.md) e [o relatório de validação](docs/QA-REDESIGN.md). Capturas com dados fictícios estão em `docs/qa/`.
