import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Check, LoaderCircle } from "lucide-react";
import Brand from "../components/Brand.jsx";
import { auth } from "../lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

export default function LoginScreen({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function createUserDataIfMissing(user) {
    const ref = doc(db, "users", user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        plan: "free",
        createdAt: Date.now(),
      });
    }
  }

  const provider = new GoogleAuthProvider();

  async function forgotPassword() {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Digite seu e-mail primeiro.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Link de recuperação enviado. Confira sua caixa de entrada.");
    } catch {
      setError(
        "Não foi possível enviar o link. Confira o e-mail e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await signInWithPopup(auth, provider);
      onLoginSuccess(result.user);
    } catch (err) {
      setError(
        err.code === "auth/popup-closed-by-user"
          ? "A janela foi fechada. Você pode tentar novamente."
          : "Não foi possível entrar com o Google. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim(),
          });
        }

        await createUserDataIfMissing(userCredential.user);
        await sendEmailVerification(userCredential.user);

        setTimeout(() => {
          onLoginSuccess(userCredential.user);
        }, 300);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await createUserDataIfMissing(userCredential.user);
      onLoginSuccess(userCredential.user);
    } catch (err) {
      console.error(err);
      setError(
        {
          "auth/invalid-credential":
            "E-mail ou senha incorretos. Confira seus dados e tente novamente.",
          "auth/email-already-in-use":
            "Este e-mail já tem uma conta. Entre ou recupere sua senha.",
          "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
          "auth/too-many-requests":
            "Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
          "auth/network-request-failed":
            "Não foi possível conectar. Confira sua conexão e tente novamente.",
        }[err.code] ||
          "Não foi possível entrar. Confira seus dados e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <h2>
            Seu ritmo.
            <br />
            Sua evolução.
          </h2>
          <p>
            Treino, alimentação e pequenas conquistas. Um espaço para cuidar de
            você, todos os dias.
          </p>
        </div>
        <div className="auth-story-footer">
          <span className="brand-mark">
            <Check size={18} />
          </span>
          <span>Consistência começa com um primeiro passo.</span>
        </div>
        <div className="training-track" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <div className="md:hidden mb-10">
            <Brand />
          </div>
          <header className="mb-8">
            <h1>
              {isRegistering ? "Comece sua jornada" : "Bom ter você de volta"}
            </h1>
            <p className="text-sm text-fyzen-muted mt-3 leading-relaxed">
              {isRegistering
                ? "Crie sua conta e encontre uma rotina que combina com você."
                : "Entre na sua conta para continuar de onde parou."}
            </p>
          </header>
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="btn-ghost w-full"
          >
            <img src="/google.png" alt="" width={18} height={18} /> Continuar
            com Google
          </button>
          <div className="auth-divider">ou use seu e-mail</div>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-busy={loading}
          >
            {isRegistering && (
              <label className="block">
                <span>Nome</span>
                <input
                  type="text"
                  name="name"
                  className="input-style mt-2"
                  placeholder="Como podemos chamar você?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </label>
            )}
            <label className="block">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                className="input-style mt-2"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </label>
            <div>
              <label htmlFor="auth-password" className="field-label">
                Senha
              </label>
              <div className="password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input-style"
                  placeholder={
                    isRegistering ? "Pelo menos 6 caracteres" : "Sua senha"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegistering ? 6 : undefined}
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                  disabled={loading}
                />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {!isRegistering && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={forgotPassword}
                  disabled={loading}
                  className="text-link"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            {error && (
              <p className="status-message error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="status-message success" role="status">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" /> Aguarde…
                </>
              ) : (
                <>
                  {isRegistering
                    ? "Criar minha conta"
                    : "Entrar na minha conta"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="text-center text-sm text-fyzen-muted pt-3">
              {isRegistering ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                  setSuccess("");
                }}
                className="text-link"
              >
                {isRegistering ? "Entrar" : "Criar conta grátis"}
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
