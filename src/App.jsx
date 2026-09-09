import React, { useEffect, useState, lazy, Suspense } from "react";
import { signOut } from "firebase/auth";
import { auth, firebaseConfigError } from "./lib/firebaseConfig";
import { subscribeAuth } from "./lib/subscribeAuth";
import { withTimeout } from "./lib/withTimeout";

const UltraDashboardProtected = lazy(
  () => import("./screens/UltraDashboard.jsx"),
);
const LoginScreen = lazy(() => import("./screens/LoginScreen.jsx"));
const HomeScreen = lazy(() => import("./screens/HomeScreen.jsx"));
const PlanScreen = lazy(() => import("./screens/PlanScreen.jsx"));
const NutritionScreen = lazy(() => import("./screens/NutritionScreen.jsx"));
const ProgressScreen = lazy(() => import("./screens/ProgressScreen.jsx"));
const GoalsScreen = lazy(() => import("./screens/GoalsScreen.jsx"));
const AdminScreen = lazy(() => import("./screens/AdminScreen.jsx"));
const PremiumPage = lazy(() => import("./screens/PremiumPage.jsx"));
const VerifyEmailScreen = lazy(() => import("./screens/VerifyEmailScreen.jsx"));
const EmailActionHandler = lazy(
  () => import("./screens/EmailActionHandler.jsx"),
);
import { LoadingState } from "./components/ScreenState.jsx";
import Brand from "./components/Brand.jsx";
import Dialog from "./components/Dialog.jsx";
import Navbar from "./components/Navbar.jsx";
const CheckoutProPage = lazy(() => import("./screens/CheckoutProPage.jsx"));
const CheckoutUltraPage = lazy(() => import("./screens/CheckoutUltraPage.jsx"));
const BillingScreen = lazy(() => import("./screens/BillingScreen.jsx"));
const WorkoutSessionScreen = lazy(
  () => import("./screens/WorkoutSessionScreen.jsx"),
);
const CoachScreen = lazy(() => import("./screens/CoachScreen.jsx"));

import { subscriptionEngine } from "./lib/subscriptionEngine";
import { PremiumProvider } from "./context/PremiumContext.jsx";

import {
  Flame,
  Home as HomeIcon,
  Dumbbell,
  Apple,
  TrendingUp,
  LogOut,
  BadgeCheck,
  Target,
  Activity,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

const SCREENS = {
  HOME: "home",
  PLAN: "plan",
  NUTRITION: "nutrition",
  PROGRESS: "progress",
  GOALS: "goals",
  PREMIUM: "premium",
  CHECKOUT_PRO: "checkout-pro",
  CHECKOUT_ULTRA: "checkout-ultra",
  BILLING: "billing",
  ULTRA_DASHBOARD: "ultra-dashboard",
  ADMIN: "admin",
  WORKOUT_SESSION: "workout-session",
  COACH: "coach",
};

const fadeSlide = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

const AUTH_TIMEOUT_MS = 12_000;
const PLAN_TIMEOUT_MS = 8_000;

function getFriendlyName(user) {
  if (!user) return "Atleta";
  if (user.displayName?.trim()) return user.displayName.trim();

  const raw = user.email?.split("@")[0] ?? "atleta";
  return raw
    .replace(/[._-]+/g, " ")
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function ConfigErrorScreen({ message }) {
  return (
    <div className="min-h-screen fyzen-bg flex items-center justify-center p-6">
      <div className="surface-card max-w-md p-6 space-y-3 text-sm">
        <h1 className="font-display text-lg text-slate-50">
          Configuração incompleta
        </h1>
        <p className="text-fyzen-muted leading-relaxed">{message}</p>
        <p className="text-fyzen-muted text-xs">
          Confira o arquivo <code className="text-slate-300">.env.local</code> e
          reinicie com <code className="text-slate-300">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-fyzen-muted text-sm fyzen-bg">
      <div className="h-8 w-8 rounded-full border-2 border-fyzen-accent/30 border-t-fyzen-accent animate-spin" />
      <p>{label}</p>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "verifyEmail") {
    return (
      <Suspense fallback={<LoadingScreen label="Abrindo verificação…" />}>
        <EmailActionHandler />
      </Suspense>
    );
  }

  if (firebaseConfigError) {
    return <ConfigErrorScreen message={firebaseConfigError} />;
  }

  return <AppShell />;
}

function AppShell() {
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState("free");
  const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const navigate = (screen) => {
    setCurrentScreen(screen);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() =>
      document.getElementById("main-content")?.focus({ preventScroll: true }),
    );
  };

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      setAuthError("Firebase Auth não inicializou.");
      return;
    }

    let settled = false;

    const finishAuth = () => {
      if (!settled) {
        settled = true;
        setLoadingAuth(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!settled) {
        console.warn("Timeout aguardando Firebase Auth");
        setAuthError(
          "Não foi possível conectar ao Firebase. Verifique internet, bloqueadores e o .env.local.",
        );
        finishAuth();
      }
    }, AUTH_TIMEOUT_MS);

    let unsub = () => {};

    try {
      unsub = subscribeAuth(async (firebaseUser) => {
        clearTimeout(timeoutId);
        finishAuth();
        setAuthError(null);

        if (!firebaseUser) {
          setUser(null);
          setUserPlan("free");
          return;
        }

        setUser(firebaseUser);

        try {
          const status = await withTimeout(
            subscriptionEngine(firebaseUser.uid),
            PLAN_TIMEOUT_MS,
            "Timeout ao carregar assinatura",
          );
          setUserPlan(status.plano || "free");
        } catch (err) {
          console.warn("Plano padrão (free):", err?.message || err);
          setUserPlan("free");
        }
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Firebase Auth:", err);
      setAuthError(err?.message || "Erro de autenticação.");
      finishAuth();
    }

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  useEffect(() => {
    const onUpgrade = () => navigate(SCREENS.PREMIUM);
    window.addEventListener("fyzen:upgrade", onUpgrade);
    return () => window.removeEventListener("fyzen:upgrade", onUpgrade);
  }, []);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    setUserPlan("free");
    setCurrentScreen(SCREENS.HOME);
  };

  if (loadingAuth) {
    return <LoadingScreen label="Conectando…" />;
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen fyzen-bg flex items-center justify-center p-6">
        <div className="surface-card max-w-md p-6 space-y-4 text-sm">
          <h1 className="font-display text-lg text-slate-50">
            Falha na conexão
          </h1>
          <p className="text-fyzen-muted leading-relaxed">{authError}</p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => window.location.reload()}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (!user)
    return (
      <Suspense fallback={<LoadingScreen label="Abrindo sua conta…" />}>
        <LoginScreen onLoginSuccess={setUser} />
      </Suspense>
    );

  if (user && !user.emailVerified) {
    return (
      <Suspense fallback={<LoadingScreen label="Abrindo verificação…" />}>
        <VerifyEmailScreen onVerified={setUser} />
      </Suspense>
    );
  }

  const friendlyName = getFriendlyName(user);
  const isAdmin =
    user?.email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL;

  const navItems = [
    { icon: HomeIcon, label: "Início", value: SCREENS.HOME },
    { icon: Dumbbell, label: "Treino", value: SCREENS.PLAN },
    { icon: Sparkles, label: "IA", value: SCREENS.COACH, accent: true },
    { icon: TrendingUp, label: "Progresso", value: SCREENS.PROGRESS },
    { icon: Apple, label: "Alimentação", value: SCREENS.NUTRITION },
    { icon: Target, label: "Metas", value: SCREENS.GOALS },
    {
      icon: BadgeCheck,
      label: userPlan !== "free" ? "Seu plano" : "Planos",
      value: SCREENS.PREMIUM,
    },
    { icon: CreditCard, label: "Minha assinatura", value: SCREENS.BILLING },
  ];

  if (userPlan?.toLowerCase() === "ultra") {
    navItems.splice(2, 0, {
      icon: Activity,
      label: "Painel Ultra",
      value: SCREENS.ULTRA_DASHBOARD,
    });
  }

  if (isAdmin) {
    navItems.push({ icon: Flame, label: "Admin", value: SCREENS.ADMIN });
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.HOME:
        return (
          <HomeScreen
            friendlyName={friendlyName}
            user={user}
            onSelectScreen={navigate}
            onStartWorkout={(workout, day) => {
              setSelectedWorkout({ workout, day });
              navigate(SCREENS.WORKOUT_SESSION);
            }}
          />
        );
      case SCREENS.PLAN:
        return (
          <PlanScreen
            onStartWorkout={(workout, day) => {
              setSelectedWorkout({ workout, day });
              navigate(SCREENS.WORKOUT_SESSION);
            }}
          />
        );
      case SCREENS.COACH:
        return <CoachScreen user={user} onSelectScreen={navigate} />;
      case SCREENS.WORKOUT_SESSION:
        return (
          <WorkoutSessionScreen
            user={user}
            workout={selectedWorkout?.workout}
            day={selectedWorkout?.day}
            onExit={() => navigate(SCREENS.PLAN)}
            onComplete={() => navigate(SCREENS.PROGRESS)}
          />
        );
      case SCREENS.NUTRITION:
        return <NutritionScreen user={user} userPlan={userPlan} />;
      case SCREENS.PROGRESS:
        return <ProgressScreen userPlan={userPlan} />;
      case SCREENS.GOALS:
        return <GoalsScreen />;
      case SCREENS.PREMIUM:
        return (
          <PremiumPage
            userPlan={userPlan}
            onPlanChange={setUserPlan}
            onSelectScreen={navigate}
          />
        );
      case SCREENS.BILLING:
        return <BillingScreen onSelectScreen={navigate} />;
      case SCREENS.CHECKOUT_PRO:
        return <CheckoutProPage onSelectScreen={navigate} />;
      case SCREENS.CHECKOUT_ULTRA:
        return <CheckoutUltraPage onSelectScreen={navigate} />;
      case SCREENS.ADMIN:
        return isAdmin ? (
          <AdminScreen user={user} isAdmin={true} />
        ) : (
          <p className="text-slate-300">
            Você não tem acesso ao painel administrativo.
          </p>
        );
      case SCREENS.ULTRA_DASHBOARD:
        return <UltraDashboardProtected onSelectScreen={navigate} />;
      default:
        return (
          <HomeScreen
            friendlyName={friendlyName}
            user={user}
            onSelectScreen={navigate}
            onStartWorkout={(workout, day) => {
              setSelectedWorkout({ workout, day });
              navigate(SCREENS.WORKOUT_SESSION);
            }}
          />
        );
    }
  };

  const activeLabel =
    navItems.find((item) => item.value === currentScreen)?.label ||
    "Assinatura";
  const primaryMobile = [
    SCREENS.HOME,
    SCREENS.PLAN,
    SCREENS.COACH,
    SCREENS.PROGRESS,
  ];
  if (currentScreen === SCREENS.WORKOUT_SESSION) {
    return (
      <Suspense fallback={<LoadingScreen label="Abrindo treino…" />}>
        <WorkoutSessionScreen
          user={user}
          workout={selectedWorkout?.workout}
          day={selectedWorkout?.day}
          onExit={() => navigate(SCREENS.PLAN)}
          onComplete={() => navigate(SCREENS.PROGRESS)}
        />
      </Suspense>
    );
  }
  return (
    <PremiumProvider userPlan={userPlan} onPlanChange={setUserPlan}>
      <div className="app-shell">
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <aside className="app-sidebar">
          <Brand />
          <Navbar items={navItems} active={currentScreen} onSelect={navigate} />
          <div className="sidebar-footer">
            <p className="text-sm text-slate-200">Um passo de cada vez.</p>
            <p className="text-xs text-fyzen-muted mt-2 leading-relaxed">
              Sua rotina de hoje constrói sua evolução.
            </p>
            <div className="account-block">
              <span className="avatar" aria-hidden="true">
                {friendlyName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-100 truncate">
                  {friendlyName}
                </p>
                <span className="text-xs text-fyzen-muted capitalize">
                  Plano {userPlan}
                </span>
              </div>
              <button
                type="button"
                className="icon-button text-fyzen-muted"
                onClick={handleLogout}
                aria-label="Sair da conta"
                title="Sair da conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
        <div className="app-workspace">
          <header className="app-topbar">
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="desktop-context flex items-center gap-3">
              <span>Seu espaço</span>
              <ChevronRight size={14} />
              <span className="text-slate-200">{activeLabel}</span>
            </div>
            <div className="flex items-center gap-4">
              <time
                className="hidden lg:block"
                dateTime={new Date().toISOString().slice(0, 10)}
              >
                {new Date().toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                })}
              </time>
              <span className="plan-badge">
                <BadgeCheck size={13} /> {userPlan}
              </span>
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="app-main outline-none"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                className="screen-content"
                {...fadeSlide}
              >
                <Suspense fallback={<LoadingState />}>
                  {renderScreen()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <nav className="mobile-nav" aria-label="Navegação mobile">
          {navItems
            .filter((item) => primaryMobile.includes(item.value))
            .map(({ icon: Icon, ...item }) => (
              <button
                key={item.value}
                type="button"
                onClick={() => navigate(item.value)}
                aria-current={currentScreen === item.value ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          <button
            type="button"
            aria-expanded={mobileMenu}
            aria-haspopup="dialog"
            onClick={() => setMobileMenu(true)}
            aria-current={
              !primaryMobile.includes(currentScreen) ? "page" : undefined
            }
          >
            <Menu size={20} />
            <span>Mais</span>
          </button>
        </nav>
        {mobileMenu && (
          <Dialog
            label="Mais opções de navegação"
            onClose={() => setMobileMenu(false)}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl">Seu espaço</h2>
              <button
                className="icon-button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenu(false)}
              >
                <X size={20} />
              </button>
            </div>
            <Navbar
              items={navItems.filter(
                (item) => !primaryMobile.includes(item.value),
              )}
              active={currentScreen}
              onSelect={navigate}
            />
            <div className="account-block">
              <span className="avatar">
                {friendlyName.slice(0, 2).toUpperCase()}
              </span>
              <p className="flex-1 text-sm truncate">{friendlyName}</p>
              <button className="btn-ghost" onClick={handleLogout}>
                <LogOut size={16} /> Sair
              </button>
            </div>
          </Dialog>
        )}
      </div>
    </PremiumProvider>
  );
}
