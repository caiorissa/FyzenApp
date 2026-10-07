# Catálogo de exercícios para gravação

A Fyzen AI pode escolher até três exercícios por grupo e só pode usar nomes deste catálogo. O catálogo tem 95 movimentos; o levantamento terra romeno aparece em pernas e costas, e a remada alta aparece em costas e ombros, mas cada um precisa de apenas um vídeo. Séries, repetições e carga podem variar sem exigir outra gravação.

O arquivo `src/lib/workout/exerciseVideos.js` já tem uma linha vazia para cada exercício. Quando tiver o vídeo, cole o link entre as aspas daquela linha, por exemplo: `"Supino reto": "https://youtu.be/ID_DO_VIDEO"`. O botão passa a abrir o player do YouTube no modal. São aceitos links `youtube.com/watch`, `youtu.be`, `/embed/` e `/shorts/`; sem link válido, o botão continua oferecendo a busca no YouTube.

Na academia, a IA pode usar os 95 movimentos do catálogo. Em casa, a lista enviada à IA e a resposta são filtradas para remover os 43 movimentos que dependem de máquinas ou equipamentos específicos de academia; ficam 52 opções compatíveis com casa.

## Peito

- Crucifixo com halteres
- Crossover (academia)
- Flexão com pegada aberta
- Flexão de braço
- Flexão diamante
- Flexão inclinada na parede
- Paralelas (academia)
- Peck deck (academia)
- Supino declinado (academia)
- Supino inclinado (academia)
- Supino inclinado com halteres (academia)
- Supino reto com halteres (academia)
- Supino reto na máquina (academia)
- Supino reto (academia)

## Costas

- Barra fixa
- Barra fixa assistida (academia)
- Levantamento terra
- Levantamento terra romeno
- Pulldown (academia)
- Pullover na máquina (academia)
- Puxada neutra (academia)
- Puxada aberta (academia)
- Puxada na frente (academia)
- Remada baixa (academia)
- Remada cavalinho (academia)
- Remada curvada
- Remada curvada com mochila
- Remada articulada (academia)
- Remada invertida na mesa
- Remada unilateral
- Remada alta (academia; também trabalha ombros)
- Serrote com halter

## Pernas e glúteos

- Afundo
- Agachamento com halteres
- Agachamento goblet
- Avanço
- Agachamento + salto
- Agachamento búlgaro
- Agachamento com barra (academia)
- Agachamento frontal (academia)
- Agachamento guiado (academia)
- Agachamento livre
- Agachamento no Smith (academia)
- Agachamento sumô
- Cadeira abdutora (academia)
- Cadeira extensora (academia)
- Cadeira flexora (academia)
- Elevação pélvica
- Elevação de panturrilha em pé
- Elevação de panturrilha sentada (academia)
- Kettlebell swing
- Leg press (academia)
- Levantamento terra romeno
- Mesa flexora (academia)
- Passada andando
- Step-up no banco
- Stiff
- Hack squat (academia)

## Ombros

- Desenvolvimento Arnold
- Desenvolvimento militar (academia)
- Desenvolvimento no Smith (academia)
- Desenvolvimento
- Desenvolvimento com halteres
- Desenvolvimento com mochila
- Elevação lateral
- Face pull (academia)
- Remada alta (academia; também trabalha costas)

## Bíceps

- Rosca alternada
- Rosca direta
- Rosca direta com mochila
- Rosca martelo
- Rosca martelo com halteres

## Tríceps

- Tríceps banco
- Tríceps corda (academia)
- Tríceps testa
- Tríceps pulley (academia)

## Core

- Abdominal bicicleta
- Abdominal canivete
- Dead bug
- Escalador (mountain climber)
- Prancha
- Prancha lateral
- Roda abdominal
- Russian twist

## Cardio e condicionamento

- Bicicleta ergométrica
- Caminhada inclinada na esteira (academia)
- Corrida leve
- Burpee
- Corrida estacionária
- Corda naval (academia)
- Elíptico (academia)
- Escada (academia)
- Esteira (academia)
- Pular corda
- Polichinelos
- Polichinelos cruzados
- Remo ergométrico (academia)

Ao regenerar um dia, a IA mantém os grupos musculares e a ordem daquele dia. Respostas com outro grupo ou exercícios fora do catálogo são rejeitadas; o treino salvo não é substituído por um grupo diferente.
