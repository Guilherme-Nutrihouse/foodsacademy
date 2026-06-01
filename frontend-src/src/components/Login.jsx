import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import OndaTop from "../assets/images/background_onda1.jpg";
import OndaBottom from "../assets/images/background_onda2.jpg";
import Logo from "../assets/logos/logo_branca.png";
import { fetchJson } from "../utils/app";

const USER_KEY = "rememberedLoginUser";
const cookieOptions = () => ({
  expires: 2,
  sameSite: "lax",
  secure: window.location.protocol === "https:",
});

const safe = (fn, fallback = "") => {
  try {
    return fn() || fallback;
  } catch {
    return fallback;
  }
};

const getRememberedUser = () =>
  safe(() => Cookies.get(USER_KEY) || localStorage.getItem(USER_KEY));

const saveRememberedUser = (username) =>
  safe(() => {
    if (!username) {
      Cookies.remove(USER_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }

    Cookies.set(USER_KEY, username, cookieOptions());
    localStorage.setItem(USER_KEY, username);
  });

const getRememberedSessionUsername = async () => {
  try {
    const data = await fetchJson("/api/remember-session", {
      credentials: "include",
    });
    return data.remembered && typeof data.username === "string" ? data.username : "";
  } catch {
    return "";
  }
};

const saveBrowserPassword = async (form) => {
  try {
    if (!form || !window.PasswordCredential || !navigator.credentials?.store) return;
    await navigator.credentials.store(new window.PasswordCredential(form));
  } catch {
    return;
  }
};

const fillSavedBrowserCredential = async (usernameInput, passwordInput) => {
  try {
    if (!window.PasswordCredential || !navigator.credentials?.get) return;

    const credential = await navigator.credentials.get({
      password: true,
      mediation: "optional",
    });
    if (!credential) return;

    const credentialUser = credential.id?.replace(/@nutrihouse\.intra$/i, "") || "";
    const currentUser = usernameInput?.value.trim().toLowerCase();
    const matches =
      !currentUser ||
      [credentialUser.toLowerCase(), credential.id?.toLowerCase()].includes(
        currentUser
      );

    if (usernameInput && credentialUser && matches) usernameInput.value = credentialUser;
    if (passwordInput && !passwordInput.value && credential.password && matches) {
      passwordInput.value = credential.password;
    }
  } catch {
    return;
  }
};

const authError = (message = "") => {
  const text = message.toLowerCase();
  if (text.includes("senha") || text.includes("password")) return "Senha incorreta";
  if (["usuario", "usuário", "user"].some((key) => text.includes(key))) {
    return "Usuário não encontrado";
  }
  return "Falha na autenticação";
};

const Login = () => {
  const [rememberedUser] = useState(getRememberedUser);
  const [rememberUser, setRememberUser] = useState(Boolean(rememberedUser));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    getRememberedSessionUsername().then((username) => {
      if (!active || !username) return;
      safe(() => localStorage.setItem("username", username));
      navigate("/home", { replace: true });
    });

    fillSavedBrowserCredential(usernameInputRef.current, passwordInputRef.current);
    const timer = setTimeout(() => {
      if (usernameInputRef.current && !usernameInputRef.current.value) {
        usernameInputRef.current.value = rememberedUser;
      }
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [navigate, rememberedUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const user = String(data.username || "").trim();
    const password = String(data.password || "");
    const missing = !user ? "Informe o usuário" : !password ? "Informe a senha" : "";

    setError(missing);
    if (missing) return;
    setLoading(true);

    try {
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userDN: `${user}@nutrihouse.intra`,
          password,
          rememberLogin: rememberUser,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(authError(result.message));
        return;
      }

      safe(() => localStorage.setItem("username", result.username));
      saveRememberedUser(rememberUser ? user : "");
      if (rememberUser) {
        if (usernameInputRef.current) usernameInputRef.current.value = user;
        await saveBrowserPassword(form);
      }
      navigate("/home");
    } catch {
      setError("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      id: "usuario",
      label: "Usuário:",
      name: "username",
      placeholder: "Digite seu usuário",
      ref: usernameInputRef,
      type: "text",
      props: { autoCapitalize: "none", autoComplete: "username", spellCheck: false },
    },
    {
      id: "senha",
      label: "Senha:",
      name: "password",
      placeholder: "Digite sua senha",
      ref: passwordInputRef,
      type: "password",
      props: { autoComplete: "current-password" },
    },
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F7] px-4 py-8">
      {[
        [OndaTop, "left-0 top-0"],
        [OndaBottom, "bottom-0 right-0"],
      ].map(([src, position]) => (
        <img
          key={position}
          src={src}
          alt=""
          className={`pointer-events-none absolute z-0 h-[22%] max-w-[70%] object-contain sm:h-[30%] sm:max-w-[50%] ${position}`}
        />
      ))}

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-lg bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] p-5 text-center shadow-lg sm:p-6">
        <img src={Logo} alt="Logo NutriHouse" className="mb-[-16px] w-36 sm:w-[144px]" />
        <h1 className="mt-1 text-2xl font-semibold text-white">Bem-vindo</h1>
        <p className="mb-4 text-sm text-white">Acesse com seu usuário:</p>

        <form
          onSubmit={handleLogin}
          method="post"
          action="/api/authenticate"
          className="flex w-full flex-col gap-4"
          autoComplete="on"
        >
          {fields.map(({ id, label, props, ref, ...field }) => (
            <div key={id} className="text-center">
              <label htmlFor={id} className="mb-1 block font-medium text-white">
                {label}
              </label>
              <input
                id={id}
                ref={ref}
                className="w-full max-w-[265px] rounded-full border-none p-2 outline-none focus:ring-2 focus:ring-yellow-300"
                required
                {...field}
                {...props}
              />
            </div>
          ))}

          <label className="mx-auto -mt-1 flex w-full max-w-[265px] items-center gap-2 text-left text-sm text-white">
            <input
              type="checkbox"
              checked={rememberUser}
              onChange={(e) => setRememberUser(e.target.checked)}
              className="h-4 w-4 rounded border-white/70 accent-white-300"
            />
            <span>Lembrar acesso neste computador</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mx-auto mt-2 w-full max-w-40 rounded-full bg-white py-2 font-bold text-[#0c0b0b] transition-all hover:bg-gray-300 disabled:opacity-80"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a
          href="https://app.milvus.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm text-white hover:underline"
        >
          Esqueceu a senha?
        </a>

        {error && (
          <p className="mt-3 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
      </section>
    </main>
  );
};

export default Login;
