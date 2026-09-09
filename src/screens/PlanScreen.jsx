import PageHeader from "../components/PageHeader.jsx";
import { LoadingState } from "../components/ScreenState.jsx";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Sparkles,
  Activity,
  Apple,
  BarChart2,
  Flame,
  Loader2,
} from "lucide-react";
import { db } from "../lib/firebaseConfig";
import { subscribeAuth } from "../lib/subscribeAuth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import WorkoutChecklist from "@/components/WorkoutChecklist";
import WeeklyInsightsModal from "@/components/premium/WeeklyInsightsModal";
import { gerarWeeklyInsights } from "@/lib/premium/weeklyInsights";
import RegenerateDayButton from "@/components/premium/RegenerateDayButton";
import RegenerateWeekButton from "@/components/premium/RegenerateWeekButton";
import { usePremium } from "@/context/PremiumContext";
import { gerarPlanoSemanaIA } from "@/lib/aiWorkoutService";

const diasSemana = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

function getDiaSemanaAtual() {
  return diasSemana[new Date().getDay()];
}

const initialForm = {
  sexo: "",
  idade: "",
  peso: "",
  altura: "",
  nivel: "",
  objetivo: "",
  local: "",
  exerciciosPorGrupo: "3",
};

const fadeIn = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
  viewport: { once: true, amount: 0.3 },
};

const DIAS = ["segunda", "terça", "quarta", "quinta", "sexta"];
export default function PlanScreen({ onStartWorkout }) {
  const [form, setForm] = useState(initialForm);
  const savedForm = useRef(JSON.stringify(initialForm));
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [plan, setPlan] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [, setNutrition] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [weeklyInsights, setWeeklyInsights] = useState(null);
  const [openInsights, setOpenInsights] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState("segunda");
  const skipInsights = false;
  const [bloqueado, setBloqueado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const { nivel, isPro, isUltra } = usePremium();

  useEffect(() => {
    const unsubscribe = subscribeAuth(async (u) => {
      if (u) {
        setUser(u);
        await carregarPlano(u.uid);
      } else {
        setUser(null);
        setPlan(null);
        setAnalysis(null);
        setNutrition(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const diaAtual = getDiaSemanaAtual();

  const treinosPorDiaMemo = useMemo(() => {
    if (!plan?.treinos) return {};

    const obj = DIAS.reduce((acc, dia) => {
      acc[dia] = [];
      return acc;
    }, {});

    (plan.treinos || []).forEach((grupo, index) => {
      const dia = DIAS[index % DIAS.length];
      obj[dia].push({ ...grupo, _globalIndex: index });
    });

    return obj;
  }, [plan]);

  const treinosDoDia = useMemo(() => {
    return treinosPorDiaMemo[diaSelecionado] || [];
  }, [treinosPorDiaMemo, diaSelecionado]);

  useEffect(() => {
    if (!diaSelecionado) return;

    const indexAtual = diasSemana.indexOf(diaAtual);
    const indexTreino = diasSemana.indexOf(diaSelecionado);

    if (indexTreino > indexAtual) {
      setBloqueado(true);
      setMensagem(
        `Hoje é ${diaAtual}. Volte na ${diaSelecionado} para completar este treino.`,
      );
      return;
    }

    if (indexTreino < indexAtual) {
      setBloqueado(true);
      setMensagem(`Você já passou o dia de ${diaSelecionado}.`);
      return;
    }

    setBloqueado(false);
    setMensagem("");
  }, [diaSelecionado, diaAtual]);

  const carregarPlano = async (uid) => {
    try {
      const ref = doc(db, "planos", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const loadedForm = { ...initialForm, ...(data.form ?? {}) };
        savedForm.current = JSON.stringify(loadedForm);
        setForm(loadedForm);
        setAnalysis(data.analysis ?? null);
        setPlan(data.plan ?? null);
        setNutrition(data.nutrition ?? null);
        setStatusMsg("Seu plano está atualizado.");
      }
    } catch (err) {
      console.error("Erro ao carregar plano:", err);
      setLoadFailed(true);
      setStatusMsg("Não foi possível carregar seu plano anterior.");
    }
  };

  useEffect(() => {
    if (isEditingForm || !plan?.treinos || skipInsights) return;

    const gerar = async () => {
      try {
        const novos = await gerarWeeklyInsights(plan.treinos, DIAS, nivel);
        setWeeklyInsights(novos);
      } catch (err) {
        console.error("Erro ao gerar insights semanais:", err);
      }
    };

    gerar();
  }, [plan, nivel, isEditingForm, skipInsights]);

  const salvarPlano = async (uid, dados) => {
    try {
      await setDoc(doc(db, "planos", uid), dados, { merge: true });
      setStatusMsg("Plano salvo automaticamente na sua conta.");
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      setStatusMsg("Não foi possível salvar o plano. Tente novamente.");
      throw err;
    }
  };

  const exerciciosBase = useMemo(
    () => ({
      emagrecimento: {
        casa: [
          {
            grupo: "Cardio leve",
            exercicios: [
              "Polichinelos – 3x40s",
              "Corrida estacionária – 3x1min",
              "Pular corda – 3x30s",
              "Escalador (mountain climber) – 3x20 reps",
              "Agachamento com salto – 3x15 reps",
              "Corrida lateral – 3x30s",
            ],
          },
          {
            grupo: "Corpo completo",
            exercicios: [
              "Agachamento livre – 4x15",
              "Flexão de braço – 3x10",
              "Prancha – 3x30s",
              "Afundo alternado – 3x12 cada perna",
              "Abdominal infra – 3x20",
              "Polichinelo com toque no chão – 3x20",
            ],
          },
          {
            grupo: "Pernas e glúteos",
            exercicios: [
              "Agachamento sumô – 4x15",
              "Avanço (lunge) – 3x12 cada perna",
              "Elevação pélvica – 4x12",
              "Afundo búlgaro – 3x10 cada perna",
              "Passada lateral – 3x12",
              "Ponte com uma perna – 3x10 cada perna",
            ],
          },
          {
            grupo: "Core e estabilidade",
            exercicios: [
              "Prancha – 3x30s",
              "Prancha lateral – 3x20s cada lado",
              "Abdominal bicicleta – 3x20",
              "Abdominal canivete – 3x12",
              "Prancha com elevação de perna – 3x10 cada perna",
              "Prancha com ombro – 3x20",
            ],
          },
          {
            grupo: "HIIT em casa",
            exercicios: [
              "Corrida estacionária – 30s",
              "Burpees – 10 reps",
              "Polichinelos – 30s",
              "Escalador – 20 reps",
              "Agachamento com salto – 15 reps",
              "Descanso ativo (marchar parado) – 30s",
            ],
          },
        ],
        academia: [
          {
            grupo: "Cardio e resistência",
            exercicios: [
              "Esteira – 20 min",
              "Escada – 10 min",
              "Elíptico – 15 min",
              "Bicicleta ergométrica – 10 min",
              "Corrida leve na pista – 15 min",
              "Remo ergométrico – 8 min",
            ],
          },
          {
            grupo: "Pernas focadas",
            exercicios: [
              "Leg press – 4x15",
              "Cadeira extensora – 3x12",
              "Cadeira flexora – 3x12",
              "Agachamento livre – 4x12",
              "Elevação de panturrilha em pé – 4x15",
              "Avanço com halteres – 3x10 cada perna",
            ],
          },
          {
            grupo: "Treino circuito",
            exercicios: [
              "Remada baixa – 3x12",
              "Supino reto – 3x12",
              "Puxada na frente – 3x12",
              "Desenvolvimento com halteres – 3x10",
              "Abdominal na máquina – 3x15",
              "Prancha – 3x30s",
            ],
          },
          {
            grupo: "Cardio intervalado",
            exercicios: [
              "Esteira (sprints) – 10x30s rápido / 30s leve",
              "Bike em intensidade moderada – 15 min",
              "Escada rápida – 5 min",
              "Remo moderado – 8 min",
              "Caminhada leve – 10 min (resfriamento)",
            ],
          },
          {
            grupo: "Full body emagrecimento",
            exercicios: [
              "Agachamento no Smith – 4x12",
              "Supino inclinado – 3x10",
              "Puxada aberta – 3x10",
              "Elevação lateral – 3x12",
              "Tríceps testa – 3x12",
              "Rosca direta – 3x12",
            ],
          },
        ],
      },

      hipertrofia: {
        casa: [
          {
            grupo: "Peito e tríceps",
            exercicios: [
              "Flexão de braço – 4x12",
              "Flexão diamante – 3x10",
              "Flexão declinada – 3x10",
              "Mergulho entre cadeiras – 4x10",
              "Flexão isométrica – 3x30s",
              "Flexão com apoio elevado – 3x12",
            ],
          },
          {
            grupo: "Costas e bíceps",
            exercicios: [
              "Remada curvada com mochila – 4x12",
              "Rosca direta com mochila – 3x12",
              "Rosca alternada – 3x10",
              "Remada unilateral – 3x12 cada lado",
              "Bíceps martelo – 3x12",
              "Remada invertida na mesa – 3x10",
            ],
          },
          {
            grupo: "Pernas e glúteos",
            exercicios: [
              "Agachamento búlgaro – 4x10 cada perna",
              "Afundo – 3x12 cada perna",
              "Elevação pélvica – 4x12",
              "Agachamento sumô – 3x12",
              "Ponte com uma perna – 3x10 cada perna",
              "Elevação de panturrilha – 4x15",
            ],
          },
          {
            grupo: "Ombros e core",
            exercicios: [
              "Elevação lateral com garrafa – 3x15",
              "Desenvolvimento com mochila – 3x12",
              "Elevação frontal – 3x12",
              "Prancha – 3x30s",
              "Abdominal canivete – 3x12",
              "Prancha lateral – 3x20s cada lado",
            ],
          },
          {
            grupo: "Peito e costas",
            exercicios: [
              "Flexão de braço – 4x12",
              "Remada curvada – 4x12",
              "Flexão com pegada aberta – 3x10",
              "Remada unilateral – 3x12 cada lado",
              "Flexão isométrica – 3x30s",
              "Prancha – 3x30s",
            ],
          },
        ],
        academia: [
          {
            grupo: "Peito e tríceps",
            exercicios: [
              "Supino reto – 4x10",
              "Supino inclinado – 3x10",
              "Crossover – 3x12",
              "Tríceps corda – 3x12",
              "Tríceps testa – 3x10",
              "Crucifixo inclinado – 3x12",
            ],
          },
          {
            grupo: "Costas e bíceps",
            exercicios: [
              "Puxada na frente – 4x10",
              "Remada curvada – 3x10",
              "Remada baixa – 3x12",
              "Rosca direta – 3x12",
              "Rosca alternada – 3x10",
              "Pulldown – 3x12",
            ],
          },
          {
            grupo: "Pernas",
            exercicios: [
              "Agachamento livre – 4x8",
              "Leg press – 4x10",
              "Cadeira extensora – 3x12",
              "Cadeira flexora – 3x12",
              "Stiff – 3x10",
              "Elevação de panturrilha sentado – 4x15",
            ],
          },
          {
            grupo: "Ombros e trapézio",
            exercicios: [
              "Desenvolvimento com halteres – 4x10",
              "Elevação lateral – 3x12",
              "Elevação frontal – 3x12",
              "Encolhimento com barra – 4x12",
              "Remada alta – 3x10",
              "Crucifixo inverso – 3x12",
            ],
          },
          {
            grupo: "Peito, costas e braços",
            exercicios: [
              "Supino reto – 4x8",
              "Puxada aberta – 4x8",
              "Crucifixo – 3x10",
              "Remada baixa – 3x10",
              "Rosca direta – 3x10",
              "Tríceps corda – 3x10",
            ],
          },
        ],
      },

      resistencia: {
        casa: [
          {
            grupo: "Circuito funcional",
            exercicios: [
              "Corrida no lugar – 1min",
              "Polichinelos – 40s",
              "Agachamento + salto – 3x15",
              "Flexão de braço – 3x10",
              "Prancha – 3x30s",
              "Polichinelos cruzados – 3x40s",
              "Escalador cruzado – 3x20",
            ],
          },
          {
            grupo: "Resistência de pernas",
            exercicios: [
              "Agachamento livre – 4x20",
              "Afundo – 3x15 cada perna",
              "Ponte de glúteo – 4x15",
              "Agachamento sumô – 3x15",
              "Passada andando – 3x20 passos",
              "Elevação de panturrilha – 4x20",
            ],
          },
          {
            grupo: "Resistência de membros superiores",
            exercicios: [
              "Flexão de braço – 4x15",
              "Flexão inclinada na parede – 3x20",
              "Mergulho em cadeira – 3x15",
              "Remada invertida na mesa – 3x12",
              "Prancha alta – 3x40s",
              "Prancha com ombro – 3x20",
            ],
          },
          {
            grupo: "Core avançado",
            exercicios: [
              "Prancha – 4x40s",
              "Abdominal bicicleta – 3x20",
              "Abdominal canivete – 3x15",
              "Prancha lateral – 3x25s cada lado",
              "Prancha com elevação de perna – 3x10 cada perna",
              "Escalador – 3x25",
            ],
          },
          {
            grupo: "HIIT resistência",
            exercicios: [
              "Burpees – 10 reps",
              "Corrida estacionária – 40s",
              "Polichinelos – 40s",
              "Agachamento com salto – 15 reps",
              "Escalador – 20 reps",
              "Prancha – 30s",
            ],
          },
        ],
        academia: [
          {
            grupo: "Cardio + força",
            exercicios: [
              "Esteira – 15min ritmo moderado",
              "Corda naval – 3x30s",
              "Agachamento com barra – 4x12",
              "Flexão de braço – 3x10",
              "Remada baixa – 3x12",
              "Prancha – 3x40s",
            ],
          },
          {
            grupo: "Resistência de pernas",
            exercicios: [
              "Leg press – 4x15",
              "Agachamento guiado – 4x12",
              "Cadeira extensora – 3x15",
              "Cadeira flexora – 3x15",
              "Panturrilha em pé – 4x20",
              "Afundo com halteres – 3x12 cada perna",
            ],
          },
          {
            grupo: "Resistência de superiores",
            exercicios: [
              "Supino reto – 3x15",
              "Puxada na frente – 3x15",
              "Desenvolvimento – 3x15",
              "Remada baixa – 3x15",
              "Tríceps polia – 3x15",
              "Rosca direta – 3x15",
            ],
          },
          {
            grupo: "Circuito metabólico",
            exercicios: [
              "Corda naval – 3x30s",
              "Kettlebell swing – 3x15",
              "Burpee – 3x12",
              "Agachamento frontal – 3x12",
              "Remada curvada – 3x12",
              "Abdominal na bola – 3x20",
            ],
          },
          {
            grupo: "Cardio prolongado",
            exercicios: [
              "Esteira – 25min",
              "Bike – 20min",
              "Elíptico – 15min",
              "Remo – 10min",
              "Caminhada leve – 10min (resfriamento)",
              "Abdominal prancha – 3x40s",
            ],
          },
        ],
      },
    }),
    [],
  );

  const calcularAnalise = () => {
    const peso = parseFloat(form.peso);
    const alturaCm = parseFloat(form.altura);
    const idade = parseFloat(form.idade);

    if (!peso || !alturaCm || !idade) return null;

    const altura = alturaCm / 100;
    const imc = peso / (altura * altura);

    let classificacao = "";
    if (imc < 18.5) classificacao = "Abaixo do peso";
    else if (imc < 25) classificacao = "Peso normal";
    else if (imc < 30) classificacao = "Sobrepeso";
    else classificacao = "Obesidade";

    const tmb =
      form.sexo === "feminino"
        ? 655 + 9.6 * peso + 1.8 * alturaCm - 4.7 * idade
        : 66 + 13.7 * peso + 5 * alturaCm - 6.8 * idade;

    let fator = 1.2;
    if (form.nivel === "intermediario") fator = 1.5;
    if (form.nivel === "avancado") fator = 1.8;

    const gasto = Math.round(tmb * fator);

    return {
      imc: imc.toFixed(1),
      classificacao,
      gasto,
    };
  };

  const camposObrigatorios = () => {
    const fields = [
      "sexo",
      "idade",
      "peso",
      "altura",
      "nivel",
      "objetivo",
      "local",
    ];
    return fields.every((f) => form[f]);
  };

  const validarFormulario = () => {
    const idade = parseInt(form.idade);
    const peso = parseFloat(form.peso);
    const altura = parseFloat(form.altura);

    if (!form.sexo) return "Selecione seu sexo.";
    if (!idade || idade < 10 || idade > 100) return "Idade inválida.";
    if (!peso || peso < 20 || peso > 300) return "Peso inválido.";
    if (!altura || altura < 100 || altura > 230) return "Altura inválida.";
    if (!form.nivel) return "Selecione seu nível.";
    if (!form.objetivo) return "Selecione seu objetivo.";
    if (!form.local) return "Selecione seu local de treino.";

    return null;
  };

  useEffect(() => {
    if (!user || loading || loadFailed) return;
    if (isEditingForm || JSON.stringify(form) === savedForm.current) return;

    const timeout = setTimeout(async () => {
      try {
        await salvarPlano(user.uid, {
          form,
          updatedAt: serverTimestamp(),
        });
        savedForm.current = JSON.stringify(form);
        setStatusMsg("Alterações salvas automaticamente.");
      } catch (err) {
        console.error("Erro ao autosalvar:", err);
        setStatusMsg("Falha ao salvar automaticamente.");
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [form, user, isEditingForm, loading, loadFailed]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    localStorage.setItem("fitmindFormBackup", JSON.stringify(form));
  }, [form]);

  const gerarPlanoTreino = (objetivo, local, formAtual) => {
    const base = exerciciosBase[objetivo];
    if (!base) return [];

    const tipo = local === "academia" ? base.academia : base.casa;

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    return tipo.map((grupo) => {
      const qtd =
        parseInt(formAtual.exerciciosPorGrupo) || grupo.exercicios.length;
      const embaralhados = shuffle(grupo.exercicios);
      return {
        grupo: grupo.grupo,
        exercicios: embaralhados.slice(0, qtd),
      };
    });
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!user) return alert("Faça login para gerar seu plano.");
    if (!camposObrigatorios()) return alert("Preencha todos os campos.");

    const analise = calcularAnalise();
    if (!analise) return alert("Altura, peso e idade inválidos.");

    setSaving(true);
    setStatusMsg("");
    console.info(
      `[Fyzen Plano] Atualização iniciada com ${isUltra ? "Fyzen AI" : "gerador padrão"}.`,
    );
    try {
      let planoTreino;
      let usouFallbackDaIA = false;
      if (isUltra) {
        setAiGenerating(true);
        planoTreino = await gerarPlanoSemanaIA(form);
        setAiGenerating(false);

        if (!planoTreino || planoTreino.length === 0) {
          console.warn(
            "[Fyzen Plano] IA indisponível; usando gerador padrão para este plano.",
          );
          usouFallbackDaIA = true;
          planoTreino = gerarPlanoTreino(form.objetivo, form.local, form);
        }
      } else {
        planoTreino = gerarPlanoTreino(form.objetivo, form.local, form);
      }

      const calorias =
        form.objetivo === "emagrecimento"
          ? analise.gasto - 400
          : form.objetivo === "hipertrofia"
            ? analise.gasto + 400
            : analise.gasto;
      const dados = {
        form,
        analysis: analise,
        plan: {
          info: form,
          treinos: planoTreino,
        },
        nutrition: {
          total: calorias,
          plano: [],
        },
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
      };

      setStatusMsg("Salvando seu plano...");
      setAnalysis(analise);
      setPlan(dados.plan);
      setNutrition(dados.nutrition);
      await salvarPlano(user.uid, dados);
      console.info("[Fyzen Plano] Plano salvo com sucesso.");
      setStatusMsg(
        usouFallbackDaIA
          ? "Plano gerado e salvo. A Fyzen AI está indisponível no momento, então usamos o método padrão."
          : "Plano gerado e salvo!",
      );
    } catch (err) {
      console.error("[Fyzen Plano] Não foi possível salvar o plano.", {
        tipo: err?.name || "Erro desconhecido",
      });
      setStatusMsg("Erro ao gerar seu plano.");
    } finally {
      setAiGenerating(false);
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Carregando seu treino…" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seu plano de treino"
        description="Um treino pensado para seu objetivo. Ajuste seus dados e organize sua semana."
      />
      {statusMsg && (
        <p
          role="status"
          className={
            /erro|falha|não foi/i.test(statusMsg)
              ? "status-message error"
              : "text-xs text-fyzen-muted"
          }
        >
          {statusMsg}
        </p>
      )}
      {aiGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="surface-card flex items-center gap-3 px-4 py-3 text-sm text-fyzen-accent"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Fyzen AI está gerando seu plano...</span>
        </div>
      )}

      <details className="surface-card profile-details" open={!plan}>
        <summary>
          <div>
            <span className="text-base font-medium text-slate-100">
              Seu perfil de treino
            </span>
            <p className="text-sm text-fyzen-muted mt-1">
              {plan
                ? "Revise seus dados ou atualize seu plano."
                : "Conte um pouco sobre você para começar."}
            </p>
          </div>
          <span className="text-fyzen-accent text-sm">Editar dados</span>
        </summary>
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl text-slate-100">Seu ponto de partida</h2>
            <p className="text-sm text-fyzen-muted mt-2">
              Essas informações ajudam a montar seu treino.
            </p>
          </div>
          <form
            id="workout-profile"
            className="grid sm:grid-cols-2 gap-5 text-sm"
            onSubmit={handleGenerate}
          >
            <Select
              label="Sexo"
              value={form.sexo}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => handleChange("sexo", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
            </Select>

            <Input
              label="Idade"
              type="number"
              value={form.idade}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => setForm({ ...form, idade: e.target.value })}
              suffix="anos"
            />

            <Input
              label="Peso"
              type="number"
              value={form.peso}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
              suffix="kg"
            />

            <Input
              label="Altura"
              type="number"
              value={form.altura}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => setForm({ ...form, altura: e.target.value })}
              suffix="cm"
            />

            <Select
              label="Nível"
              value={form.nivel}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => handleChange("nivel", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </Select>

            <Select
              label="Objetivo"
              value={form.objetivo}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => handleChange("objetivo", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="emagrecimento">Emagrecimento</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="resistencia">Resistência</option>
            </Select>

            <Select
              label="Local do treino"
              value={form.local}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) => handleChange("local", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="academia">Academia</option>
              <option value="casa">Casa</option>
            </Select>

            <Select
              label="Exercícios por grupo"
              value={form.exerciciosPorGrupo}
              onFocus={() => setIsEditingForm(true)}
              onBlur={() => setIsEditingForm(false)}
              onChange={(e) =>
                handleChange("exerciciosPorGrupo", e.target.value)
              }
            >
              <option value="3">3 exercícios</option>
              <option value="4">4 exercícios</option>
              <option value="5">5 exercícios</option>
              <option value="6">6 exercícios</option>
            </Select>
          </form>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-fyzen-border pt-5">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Seu plano fica salvo automaticamente ao gerar.
            </p>
            {validarFormulario() && (
              <p className="text-fyzen-muted text-xs">{validarFormulario()}</p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || loadFailed || validarFormulario() !== null}
              className="btn-primary shrink-0"
            >
              <Dumbbell className="w-4 h-4" />
              {aiGenerating
                ? "Fyzen AI gerando..."
                : saving
                  ? "Salvando..."
                  : plan
                    ? "Atualizar meu plano"
                    : "Gerar meu plano"}
            </button>
          </div>
        </div>
      </details>

      {plan?.treinos && (
        <motion.section {...fadeIn} className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-fyzen-accent" />
                Seus treinos da semana
              </h3>
              <p className="text-xs text-slate-400">
                Selecionamos grupos de treino equilibrados ao longo da semana.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {DIAS.map((dia) => (
              <button
                key={dia}
                aria-label={dia.charAt(0).toUpperCase() + dia.slice(1)}
                aria-pressed={diaSelecionado === dia}
                onClick={() => setDiaSelecionado(dia)}
                className={`min-h-11 px-1 py-2 rounded-lg text-xs font-medium transition ${
                  diaSelecionado === dia
                    ? "bg-fyzen-accent text-fyzen-bg"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="sm:hidden">
                  {dia.charAt(0).toUpperCase() + dia.slice(1, 3)}
                </span>
                <span className="hidden sm:inline">
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {(() => {
            const indicesDoDia = treinosDoDia.map((g) => g._globalIndex);

            const handleRegeneratedDay = async (novoDia) => {
              if (!novoDia) return;
              const novos = [...(plan.treinos || [])];

              novoDia.forEach((grupo, i) => {
                const idx = indicesDoDia[i];
                if (idx != null) {
                  novos[idx] = grupo;
                }
              });

              const next = { ...plan, treinos: novos };
              await salvarPlano(user.uid, {
                plan: next,
                updatedAt: serverTimestamp(),
              });
              setPlan(next);
            };

            const handleRegeneratedWeek = async (novaSemana) => {
              if (!novaSemana) return;
              const next = { ...plan, treinos: [...novaSemana] };
              await salvarPlano(user.uid, {
                plan: next,
                updatedAt: serverTimestamp(),
              });
              setPlan(next);
              setDiaSelecionado((d) => d);
            };

            return (
              <>
                {(isUltra || isPro) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <RegenerateDayButton
                      nivel={nivel}
                      isPro={isPro}
                      isUltra={isUltra}
                      dayData={treinosDoDia}
                      form={form}
                      diaSelecionado={diaSelecionado}
                      onRegenerated={handleRegeneratedDay}
                    />

                    <RegenerateWeekButton
                      nivel={nivel}
                      isPro={isPro}
                      isUltra={isUltra}
                      form={form}
                      objetivo={form.objetivo}
                      local={form.local}
                      gerarPlanoTreino={gerarPlanoTreino}
                      onRegenerated={handleRegeneratedWeek}
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {treinosDoDia.map((treino, i) => (
                    <div
                      key={treino._globalIndex ?? `${treino.grupo}-${i}`}
                      className="glass-card rounded-2xl p-4 border border-white/5 bg-slate-900/60"
                    >
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                        {treino.grupo}
                      </p>

                      {bloqueado && (
                        <p className="text-sm text-fyzen-muted mt-2">
                          {mensagem}
                        </p>
                      )}

                      <WorkoutChecklist
                        key={`${diaSelecionado}-${treino._globalIndex}`}
                        treino={treino.exercicios}
                        grupo={treino.grupo}
                        dia={diaSelecionado}
                        bloqueado={bloqueado}
                      />

                      <button
                        type="button"
                        className="btn-primary mt-4 w-full"
                        disabled={bloqueado}
                        onClick={() => onStartWorkout?.(treino, diaSelecionado)}
                      >
                        <Dumbbell size={17} /> Iniciar modo treino
                      </button>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </motion.section>
      )}

      {analysis && (
        <motion.section
          {...fadeIn}
          className="glass-card rounded-3xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                <Activity className="w-5 h-5 text-fyzen-accent" />
                Análise corporal
              </h3>
              <p className="text-xs text-slate-400">
                Esses valores ajudam a ajustar treinos e alimentação
                recomendados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenInsights(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-teal-400/40 text-fyzen-accent hover:bg-teal-400/10 flex items-center gap-1"
            >
              <BarChart2 className="w-3 h-3" />
              Ver resumo semanal
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <InsightCard
              icon={Activity}
              label="IMC"
              value={analysis.imc}
              helper={analysis.classificacao}
            />
            <InsightCard
              icon={Flame}
              label="Gasto calórico diário"
              value={`${analysis.gasto} kcal`}
              helper="Estimativa baseada em TMB + nível"
            />
            <InsightCard
              icon={Apple}
              label="Meta calórica sugerida"
              value={
                form.objetivo === "emagrecimento"
                  ? `${analysis.gasto - 400} kcal`
                  : form.objetivo === "hipertrofia"
                    ? `${analysis.gasto + 400} kcal`
                    : `${analysis.gasto} kcal`
              }
              helper={
                form.objetivo === "emagrecimento"
                  ? "Déficit moderado para perda de peso"
                  : form.objetivo === "hipertrofia"
                    ? "Superávit controlado para ganho de massa"
                    : "Manutenção aproximada do peso atual"
              }
            />
          </div>
        </motion.section>
      )}

      {openInsights && (
        <WeeklyInsightsModal
          open={openInsights}
          onClose={() => setOpenInsights(false)}
          insights={weeklyInsights}
        />
      )}
    </div>
  );
}

function Input({ label, suffix, ...props }) {
  return (
    <label className="text-slate-300 text-sm space-y-2">
      <span>{label}</span>
      <div className="relative">
        <input
          aria-label={label}
          name={label}
          {...props}
          className="input-style pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="text-slate-300 text-sm space-y-2">
      <span>{label}</span>
      <select
        aria-label={label}
        name={label}
        {...props}
        className="input-style"
      >
        {children}
      </select>
    </label>
  );
}

function InsightCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-xl p-4 bg-fyzen-bg flex flex-col gap-2">
      <span className="text-xs text-slate-400 uppercase tracking-wide flex items-center gap-2">
        <Icon className="w-4 h-4 text-fyzen-accent" />
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-50">{value}</span>
      <span className="text-xs text-slate-500">{helper}</span>
    </div>
  );
}
