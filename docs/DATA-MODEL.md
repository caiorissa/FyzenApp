# Modelo de dados — Fyzen 2.0

Fyzen 2.0 é aditivo. Nenhuma coleção existente foi removida ou renomeada.

## Existente (preservado)

- `planos/{uid}`: perfil, análise, plano semanal e nutrição.
- `historicoTreino/{uid}/registros/{id}`: histórico usado pelas telas antigas.
- `metas/{uid}`, `nutrition/{uid}/days/{yyyy-mm-dd}` e `progresso/{uid}`.

### Plano alimentar semanal (aditivo)

A sugestão semanal da Fyzen AI e as preferências declaradas são salvas dentro de `nutrition` em `planos/{uid}`. A atualização usa merge e preserva `nutrition.total`, o campo legado `nutrition.plano`, o treino em `plan` e todos os documentos do diário.

```js
nutrition: {
  total: 2300, // meta existente, preservada
  plano: [], // contrato legado, preservado
  preferenciasPlanoSemanal: {
    allergies: "amendoim, leite (ou 'Nenhuma conhecida')",
    restrictions: "sem lactose (ou 'Nenhuma conhecida')",
    preferences: "comida brasileira",
    clinicalDietRequired: false
  },
  planoSemanal: {
    version: 1,
    generatedAt: "ISO-8601",
    targetCalories: 2300,
    days: [{
      day: "segunda",
      workoutGroups: ["Pernas"],
      exercises: ["Agachamento livre – 4x10"],
      isRestDay: false,
      meals: [{
        name: "Almoço",
        foods: [{ item: "Arroz", amount: "100 g" }],
        estimatedNutrition: { calories: 500, protein: 30, carbs: 60, fat: 15 }
      }]
    }]
  }
}
```

Porções e valores nutricionais são estimativas. Se o usuário editar alimentos ou quantidades, os valores gerados ficam identificados como estimativas originais e não são recalculados. O plano é uma sugestão; não é copiado para `nutrition/{uid}/days/{yyyy-mm-dd}`. O diário só muda quando o usuário registra uma refeição nele.

## Sessões detalhadas

`workoutSessions/{uid}/sessions/{sessionId}` é o novo registro canônico de uma sessão do Modo Treino. `sessionId` nasce no cliente e é reutilizado em cada sync, portanto reenvios são idempotentes.

```js
{
  schemaVersion: 2,
  id, userId, workoutId, name, day,
  status: "active" | "completed",
  startedAt, completedAt, updatedAt,
  currentExerciseIndex, restEndsAt,
  exercises: [{
    exerciseId, name, muscleGroup, equipment,
    prescribedSets, prescribedReps, prescribedRestSeconds,
    sets: [{ setNumber, weight, reps, completed, completedAt }]
  }],
  totalSets, totalVolume, feedback, syncStatus
}
```

Campos novos são opcionais. O adaptador converte exercícios legados como `"Supino reto – 4x10"` em uma forma de exibição estruturada, sem substituir o texto fonte de `planos`.

Ao concluir, a mesma sessão gera/atualiza `historicoTreino/{uid}/registros/{sessionId}` com `schemaVersion: 2`, `sessionId`, séries, volume e resumo. Leitores antigos continuam funcionando; leitores novos priorizam `workoutSessions` quando disponível.

## Regras Firestore

As regras estão versionadas em [firestore.rules](../firestore.rules). Para o novo caminho, elas garantem tanto a posse do caminho quanto a integridade do payload:

```text
match /workoutSessions/{userId}/sessions/{sessionId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if isOwner(userId) && request.resource.data.userId == userId;
  allow update: if isOwner(userId) &&
                resource.data.userId == userId &&
                request.resource.data.userId == userId;
  allow delete: if isOwner(userId);
}
```
