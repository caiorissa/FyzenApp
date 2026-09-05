# Validação do redesign — 5 de setembro de 2026

## Escopo

Entrada/cadastro, recuperação e verificação de e-mail, shell, home, treino/perfil/checklist, alimentação, metas, progresso, planos, checkout, assinatura, Ultra e administração. Contratos de Firestore, identificadores de telas, preços Stripe e endpoints existentes foram preservados.

## Correções relevantes

- Navegação mobile com todos os destinos acessíveis, sem comprimir sete a nove itens na barra inferior.
- Atalhos funcionais na home; retorno do checkout para a tela de planos.
- Plano correto no modal de personalização; foco contido, Escape, retorno de foco e rolagem em diálogos.
- Formulários com labels, nomes, foco, validação e feedback de sucesso/falha distintos.
- Metas e refeições só confirmam alterações após persistência; carregamentos antigos do diário não sobrescrevem o dia selecionado.
- Datas locais no diário; calendário de consistência inclui hoje; barras com zero registros exibem zero.
- Proteção contra autosalvar perfil antes do carregamento ou após falha de leitura.
- Regeneração semanal recebe os parâmetros necessários; regeneração diária/semanal salva o resultado e apresenta falhas.
- Checklist com identificação acessível, estado persistido, bloqueio por dia e contraste legível.
- Regra única de expiração da assinatura para cabeçalho, navegação e permissões; assinatura expirada não mantém controles pagos disponíveis.
- Hooks condicionais e referências inválidas preexistentes corrigidos. Trechos comprovadamente não referenciados foram retirados; fluxos ativos mantidos.
- Dependências reinstaladas após travamento de leitura na instalação anterior, e atualizadas dentro das faixas compatíveis. Cache do servidor de testes separado do desenvolvimento.
- Telas carregadas sob demanda; Firebase em chunk próprio; sem aviso de tamanho de bundle.

## Evidências

19 testes Playwright em Chromium: telas principais em 360, 390, 768, 1024 e 1440 px; formulários de acesso; persistência de metas/refeições; falha de gravação; geração de plano; personalização Pro; relatório e foco; menu mobile; Ultra; verificação de e-mail; checklist sem registro duplicado; contrato do checkout e recuperação de erro; acesso administrativo; regeneração e salvamento de dia/semana; ausência de gravação ao apenas abrir o perfil; permissões de assinatura expirada.

Axe WCAG A/AA nas telas de entrada, treino, alimentação e progresso em 390 e 1440 px, sem violações encontradas nos cenários auditados. Capturas desktop/mobile inspecionadas em `docs/qa`. Testes das telas principais verificam erros de runtime/console e overflow horizontal.

Inspeção manual adicional no Chrome do servidor real: carregamento de Firebase/Auth até a entrada, alternância entre cadastro e login, composição visual e console. O aviso de campo sem nome foi corrigido. Depois que a sessão autenticada ficou disponível, também foram conferidas home, progresso, metas, alimentação e treino com leituras reais do Firestore, sem envio de formulários. A correção de permissões foi confirmada nessa sessão. O build de produção foi aberto em `http://127.0.0.1:5176`: console com zero mensagens e 14 requisições de carregamento com respostas 200, 204 ou 304, sem 404s ou falhas. Nenhuma credencial foi inserida pelo agente e nenhuma conta real foi alterada.

## Limites

- Autenticação completa com Google/e-mail, entrega de e-mails, permissões reais do Firestore, pagamento/cancelamento efetivo no Stripe e respostas reais do serviço de IA exigem uma conta e serviços de homologação. Gravações e ações protegidas foram testadas com fixtures e interceptação; as leituras de telas autenticadas também foram conferidas na sessão real. Isso não comprova todos os serviços ponta a ponta.
- Chromium foi o navegador automatizado. Safari/Firefox e dispositivos físicos não foram executados.
- O projeto usa JavaScript/JSX e não possui TypeScript: não há resultado de `tsc` para declarar.
- Auditoria automatizada de acessibilidade complementa a inspeção de teclado e contraste; não equivale a certificação completa com leitores de tela.

## Segurança das alterações

Não havia repositório Git nesta pasta. Cópia anterior do código e configurações em `/tmp/fyzen-before-redesign`. Arquivos de ambiente e credenciais não foram modificados. Nenhuma publicação, cobrança, cancelamento real ou envio de avisos foi realizado.

## Resultado final

- `npm run lint`: passou, zero erros e zero avisos.
- `npm run format:check`: passou.
- `npm run build`: passou, sem aviso de bundle grande.
- `npm test`: 19 testes passaram.
- `npm audit --audit-level=low`: zero vulnerabilidades.
- Typecheck: não aplicável; projeto JavaScript/JSX sem TypeScript.
- Nenhuma fixture ou marcador de usuário de teste presente no bundle de produção.
