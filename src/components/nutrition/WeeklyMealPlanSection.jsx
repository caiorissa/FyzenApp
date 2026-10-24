import React, { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
import { gerarPlanoAlimentarSemanal } from "../../lib/aiMealPlanService.js";
import {
  hasNutritionGenerationContext,
  validarPlanoAlimentarSemanal,
} from "../../lib/mealPlanValidation.js";

const DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const PREFERENCIAS_VAZIAS = {
  allergies: "",
  restrictions: "",
  preferences: "",
  clinicalDietRequired: false,
};

function nomeDia(value) {
  return value ? value[0].toLocaleUpperCase("pt-BR") + value.slice(1) : "";
}

function formatarEstimativa(value) {
  return Number.isFinite(value) ? Math.round(value) : "—";
}

export default function WeeklyMealPlanSection({
  user,
  savedData,
  initialPlan,
  initialPreferences,
  loadingContext,
  onSave,
}) {
  const [plan, setPlan] = useState(initialPlan || null);
  const [preferences, setPreferences] = useState({ ...PREFERENCIAS_VAZIAS, ...(initialPreferences || {}) });
  const [selectedDay, setSelectedDay] = useState("segunda");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [planDirty, setPlanDirty] = useState(false);
  const [preferencesDirty, setPreferencesDirty] = useState(false);

  useEffect(() => {
    setPlan(initialPlan || null);
    setPlanDirty(false);
  }, [initialPlan]);

  useEffect(() => {
    setPreferences({ ...PREFERENCIAS_VAZIAS, ...(initialPreferences || {}) });
    setPreferencesDirty(false);
  }, [initialPreferences]);

  const contextReady = useMemo(() => hasNutritionGenerationContext(savedData), [savedData]);
  const age = Number(savedData?.form?.idade);
  const isMinor = Number.isFinite(age) && age > 0 && age < 18;
  const selectedPlanDay = plan?.days?.find((day) => day.day === selectedDay);
  const clinicalGate = preferences.clinicalDietRequired || isMinor;

  const updatePreference = (field, value) => {
    setPreferences((previous) => ({ ...previous, [field]: value }));
    setPreferencesDirty(true);
    setStatus("");
  };

  const persist = async (nextPlan = plan, nextPreferences = preferences) => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      if (!nextPreferences.allergies?.trim() || !nextPreferences.restrictions?.trim()) {
        throw new Error("Informe alergias e restrições. Se não houver, escreva “Nenhuma conhecida” em cada campo.");
      }
      if (nextPlan) validarPlanoAlimentarSemanal(nextPlan, nextPreferences);
      await onSave(nextPlan, nextPreferences);
      setPlan(nextPlan || null);
      setPreferences(nextPreferences);
      setPlanDirty(false);
      setPreferencesDirty(false);
      setStatus("Suas informações foram salvas.");
      return true;
    } catch (saveError) {
      setError(saveError?.message || "Não foi possível salvar o plano. Tente novamente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const gerar = async () => {
    setError("");
    setStatus("");
    if (!contextReady) {
      setError("Complete e salve seu perfil, análise, meta calórica e plano de treino antes de gerar a sugestão alimentar.");
      return;
    }
    if (isMinor) {
      setError("O Fyzen não gera planos alimentares para menores de 18 anos. Procure um responsável e um nutricionista.");
      return;
    }
    if (preferences.clinicalDietRequired) {
      setError("Para necessidades relacionadas a condições clínicas ou tratamentos, procure um nutricionista ou o profissional responsável.");
      return;
    }
    if (!preferences.allergies.trim() || !preferences.restrictions.trim()) {
      setError("Informe alergias e restrições. Se não houver, escreva “Nenhuma conhecida” em cada campo.");
      return;
    }

    setGenerating(true);
    try {
      const generatedPlan = await gerarPlanoAlimentarSemanal(user, preferences);
      setPlan(generatedPlan);
      setPlanDirty(true);
      await persist(generatedPlan, preferences);
      setSelectedDay("segunda");
    } catch (generationError) {
      setError(generationError?.message || "Não foi possível gerar o plano alimentar. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const updateMeal = (mealIndex, field, value) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day) => day.day !== selectedDay ? day : {
        ...day,
        meals: day.meals.map((meal, index) => index === mealIndex ? { ...meal, [field]: value } : meal),
      }),
    }));
    setPlanDirty(true);
    setStatus("");
  };

  const updateFood = (mealIndex, foodIndex, field, value) => {
    setPlan((previous) => ({
      ...previous,
      days: previous.days.map((day) => day.day !== selectedDay ? day : {
        ...day,
        meals: day.meals.map((meal, index) => index !== mealIndex ? meal : {
          ...meal,
          foods: meal.foods.map((food, itemIndex) => itemIndex === foodIndex ? { ...food, [field]: value } : food),
        }),
      }),
    }));
    setPlanDirty(true);
    setStatus("");
  };

  return (
    <section className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-5" aria-labelledby="weekly-meal-plan-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="weekly-meal-plan-title" className="flex items-center gap-2 text-xl font-semibold text-slate-50">
            <Sparkles className="h-5 w-5 text-fyzen-accent" />
            Plano alimentar semanal
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Sugestões da Fyzen AI considerando seu perfil e os treinos salvos. As refeições não são adicionadas ao diário.
          </p>
        </div>
        <button type="button" onClick={gerar} disabled={generating || saving || loadingContext || clinicalGate || !contextReady} className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : plan ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Gerando semana…" : plan ? "Regenerar plano semanal" : "Gerar plano semanal"}
        </button>
      </div>

      {loadingContext && <p className="text-sm text-slate-400" role="status">Carregando dados do seu plano…</p>}
      {!loadingContext && !contextReady && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100" role="status">
          Para gerar, primeiro salve seu perfil, a análise, uma meta calórica e pelo menos um treino com exercícios.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-300">
          Alergias conhecidas <span aria-hidden="true" className="text-rose-300">*</span>
          <input
            aria-label="Alergias conhecidas"
            required
            maxLength={800}
            value={preferences.allergies}
            onChange={(event) => updatePreference("allergies", event.target.value)}
            placeholder="Ex.: leite, amendoim; se não houver, escreva Nenhuma conhecida"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-300">
          Restrições alimentares <span aria-hidden="true" className="text-rose-300">*</span>
          <input
            aria-label="Restrições alimentares"
            required
            maxLength={800}
            value={preferences.restrictions}
            onChange={(event) => updatePreference("restrictions", event.target.value)}
            placeholder="Ex.: vegetariana, sem lactose; se não houver, escreva Nenhuma conhecida"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
          Preferências (opcional)
          <input
            aria-label="Preferências alimentares"
            maxLength={800}
            value={preferences.preferences}
            onChange={(event) => updatePreference("preferences", event.target.value)}
            placeholder="Ex.: refeições simples, alimentos brasileiros, sem peixe"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-950/25 p-3 text-sm text-slate-300">
        <input
          type="checkbox"
          aria-label="Preciso de dieta para condição clínica ou tratamento"
          checked={preferences.clinicalDietRequired}
          onChange={(event) => updatePreference("clinicalDietRequired", event.target.checked)}
          className="mt-1 accent-emerald-300"
        />
        <span>Preciso de dieta relacionada a uma condição clínica ou tratamento.</span>
      </label>

      {(preferencesDirty || !preferences.allergies.trim() || !preferences.restrictions.trim()) && (
        <button type="button" onClick={() => persist(plan, preferences)} disabled={saving || generating || !preferences.allergies.trim() || !preferences.restrictions.trim()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar informações alimentares
        </button>
      )}

      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/5 p-3 text-sm text-rose-200">{error}</p>}
      {status && <p role="status" className="text-sm text-emerald-200">{status}</p>}
      {preferences.clinicalDietRequired && !error && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100">
          Para alimentação ligada a uma condição clínica ou tratamento, procure um nutricionista ou o profissional que acompanha você.
        </p>
      )}
      {isMinor && !error && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100">
          O Fyzen não gera planos alimentares para menores de 18 anos. Converse com um responsável e procure um nutricionista.
        </p>
      )}

      {plan && (
        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-100">Sua sugestão da semana</h3>
              <p className="text-xs text-slate-400">Meta existente: aproximadamente {formatarEstimativa(plan.targetCalories)} kcal/dia</p>
            </div>
            {planDirty && (
              <button type="button" onClick={() => persist(plan, preferences)} disabled={saving || generating} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alterações
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="group" aria-label="Selecionar dia do plano alimentar">
            {DIAS.map((day) => (
              <button key={day} type="button" aria-pressed={selectedDay === day} onClick={() => setSelectedDay(day)} className={`rounded-xl border px-3 py-2 text-sm transition ${selectedDay === day ? "border-fyzen-accent bg-fyzen-accent text-slate-950" : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500"}`}>
                {nomeDia(day)}
              </button>
            ))}
          </div>

          {selectedPlanDay && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/20 p-4 sm:p-5">
              <div>
                <h4 className="text-lg font-semibold text-slate-100">{nomeDia(selectedPlanDay.day)}</h4>
                <p className="text-sm text-slate-400">
                  {selectedPlanDay.isRestDay ? "Dia de descanso" : `Treino: ${selectedPlanDay.workoutGroups.join(", ")}`}
                </p>
                {!selectedPlanDay.isRestDay && selectedPlanDay.exercises.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">{selectedPlanDay.exercises.join(" · ")}</p>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {selectedPlanDay.meals.map((meal, mealIndex) => (
                  <article key={`${selectedPlanDay.day}-${mealIndex}`} className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4 space-y-3">
                    <label className="block space-y-1 text-xs uppercase tracking-wide text-slate-400">
                      Refeição
                      <input
                        aria-label={`Nome da refeição ${mealIndex + 1}`}
                        maxLength={100}
                        value={meal.name}
                        onChange={(event) => updateMeal(mealIndex, "name", event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm normal-case tracking-normal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                      />
                    </label>
                    <ul className="space-y-2">
                      {meal.foods.map((food, foodIndex) => (
                        <li key={`${food.item}-${foodIndex}`} className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
                          <input
                            aria-label={`Alimento ${foodIndex + 1}`}
                            maxLength={120}
                            value={food.item}
                            onChange={(event) => updateFood(mealIndex, foodIndex, "item", event.target.value)}
                            className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                          />
                          <input
                            aria-label={`Porção ${foodIndex + 1}`}
                            maxLength={80}
                            value={food.amount}
                            onChange={(event) => updateFood(mealIndex, foodIndex, "amount", event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                          />
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-700/70 pt-3 text-xs text-slate-400">
                      <span>~{formatarEstimativa(meal.estimatedNutrition.calories)} kcal</span>
                      <span>Proteína ~{formatarEstimativa(meal.estimatedNutrition.protein)} g</span>
                      <span>Carboidratos ~{formatarEstimativa(meal.estimatedNutrition.carbs)} g</span>
                      <span>Gorduras ~{formatarEstimativa(meal.estimatedNutrition.fat)} g</span>
                    </div>
                  </article>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Porções e valores são estimativas. Ao editar alimentos ou quantidades, os valores estimados continuam sendo os originais e podem não corresponder às alterações.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Sugestão geral, não é prescrição de saúde. O IMC é apenas informativo. Confirme rótulos e ingredientes para evitar contaminação cruzada; em caso de condição clínica, procure orientação profissional.
      </p>
    </section>
  );
}
