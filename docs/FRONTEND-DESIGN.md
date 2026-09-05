# Fyzen — direção de interface

## Mapa e limites

React 18 + Vite; Tailwind 3; Lucide; Framer Motion; Firebase Auth/Firestore; Stripe. App.jsx controla as telas por estado, sem router. PremiumContext mantém o nível de acesso. Preservar coleções, contratos, geração de treino, checklist, permissões e checkout. Não alterar credenciais.

## Direção

Um diário de treinamento pessoal: calmo, legível, concentrado na próxima ação. Fundo petróleo #0C171A, superfície #142327, superfície elevada #1C3035, texto #EDF5F3, menta #89D5BF, areia #D8BC8B. DM Sans para leitura e Space Grotesk para títulos e números. Escala 12/14/16/20/28/40/64; espaçamento baseado em 4 px; raios 10/16/24. Uma identidade gráfica de trajetórias curvas, inspiradas em pistas de treino, só na entrada e no destaque inicial.

Desktop: navegação lateral estável, barra contextual e conteúdo alinhado à esquerda com largura confortável. Mobile: cabeçalho compacto, quatro destinos frequentes e menu Mais com todos os demais destinos. Formulários em uma coluna; diálogos com rolagem e foco contido.

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
