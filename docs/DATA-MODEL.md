# Modelo de dados — Fyzen 2.0

Fyzen 2.0 é aditivo. Nenhuma coleção existente foi removida ou renomeada.

## Existente (preservado)

- `planos/{uid}`: perfil, análise, plano semanal e nutrição.
- `historicoTreino/{uid}/registros/{id}`: histórico usado pelas telas antigas.
- `metas/{uid}`, `nutrition/{uid}/days/{yyyy-mm-dd}`, `progresso/{uid}` e `assinaturas/{uid}`.

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
