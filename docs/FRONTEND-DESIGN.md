# Fyzen — direção de interface

## Mapa e limites

React 18 + Vite; Tailwind 3; Lucide; Framer Motion; Firebase Auth/Firestore; Stripe. App.jsx controla as telas por estado, sem router. PremiumContext mantém o nível de acesso. Preservar coleções, contratos, geração de treino, checklist, permissões e checkout. Não alterar credenciais.

## Direção

Um diário de treinamento pessoal: calmo, legível, concentrado na próxima ação. Fundo petróleo #0C171A, superfície #142327, superfície elevada #1C3035, texto #EDF5F3, menta #89D5BF, areia #D8BC8B. DM Sans para leitura e Space Grotesk para títulos e números. Escala 12/14/16/20/28/40/64; espaçamento baseado em 4 px; raios 10/16/24. Uma identidade gráfica de trajetórias curvas, inspiradas em pistas de treino, só na entrada e no destaque inicial.

Desktop: navegação lateral estável, barra contextual e conteúdo alinhado à esquerda com largura confortável. Mobile: cabeçalho compacto, quatro destinos frequentes (`Início`, `Treino`, `IA`, `Progresso`) e menu Mais para recursos complementares. Formulários em uma coluna; diálogos com rolagem e foco contido.

## Mobile 2.0

- Breakpoints prioritários: 320, 360, 375, 390, 393, 414 e 430 px. Desktop amplia densidade, nunca define a interação principal.
- Superfícies fixas respeitam `env(safe-area-inset-*)`; a casca usa `100dvh`; conteúdo não fica atrás da navegação inferior.
- Todo alvo primário tem ao menos 44 px. Carga e reps usam controles compactos, mas não dependem de hover.
- Modo Treino é uma tela própria, sem navegação global: exercício, séries, CTA e descanso são os elementos dominantes. Descanso é um painel sticky, não um modal bloqueador.
- Animações são respostas a ações e respeitam `prefers-reduced-motion`.

```
Desktop                         Mobile
┌────────┬────────────────────┐ ┌─────────────────┐
│ Fyzen  │ Contexto / perfil   │ │ Fyzen / plano   │
│        ├────────────────────┤ ├─────────────────┤
│ Treino │ Título + orientação│ │ Título          │
│ Diário │ Próxima ação       │ │ Próxima ação    │
│ Metas  │ Conteúdo / detalhes│ │ Conteúdo        │
│        │                    │ ├─────────────────┤
│ Conta  │                    │ │ Navegação / Mais│
└────────┴────────────────────┘ └─────────────────┘
```

Revisão contra o briefing: evitar dashboard de métricas inventadas, cartões idênticos e gradientes ornamentais. A home oferece atalhos reais e sequência existente; a entrada usa composição gráfica em CSS, sem imagens pesadas. Estados de sucesso e falha devem ser distintos; modais precisam de teclado e retorno de foco; movimentos respeitam redução de movimento.

## Validação

Build de base, lint configurado e executado, testes de regressão de UI isolados de serviços reais, inspeção no navegador. Credenciais e operações pagas reais não são pressupostos dos testes.
