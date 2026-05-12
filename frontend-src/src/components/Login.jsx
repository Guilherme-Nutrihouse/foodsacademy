import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logos/logo_branca.png";
import OndaTop from "../assets/images/background_onda1.jpg";
import OndaBottom from "../assets/images/background_onda2.jpg";

// Guarda somente o usuario para facilitar o proximo acesso.
// A senha LDAP nao deve ser salva pelo app; ela fica a cargo do navegador.
const REMEMBERED_USER_KEY = "rememberedLoginUser";

// Define atributos do cookie sem quebrar ambientes HTTP internos.
const getRememberedUserCookieOptions = () => ({
  expires: 2,
  sameSite: "lax",
  secure: window.location.protocol === "https:",
});

// Recupera o usuario lembrado, sem impedir o login se cookies/storage estiverem bloqueados.
const getRememberedUser = () => {
  try {
    return Cookies.get(REMEMBERED_USER_KEY) || localStorage.getItem(REMEMBERED_USER_KEY) || "";
  } catch {
    return "";
  }
};

// Atualiza o usuario salvo conforme a escolha "Lembrar usuario".
const saveRememberedUser = (username) => {
  try {
    if (username) {
      Cookies.set(REMEMBERED_USER_KEY, username, getRememberedUserCookieOptions());
      localStorage.setItem(REMEMBERED_USER_KEY, username);
    } else {
      Cookies.remove(REMEMBERED_USER_KEY);
      localStorage.removeItem(REMEMBERED_USER_KEY);
    }
  } catch {
    // Se o navegador bloquear cookies/storage, o login ainda deve continuar normalmente.
  }
};

// Solicita ao navegador/gerenciador de senhas que salve a credencial validada.
const promptBrowserPasswordSave = async (formElement) => {
  if (!formElement) {
    return;
  }

  try {
    if (!window.PasswordCredential || !navigator.credentials?.store) {
      return;
    }

    await navigator.credentials.store(
      new window.PasswordCredential(formElement)
    );
  } catch {
    // Alguns navegadores nao suportam esse fluxo; o login deve continuar normalmente.
  }
};

// Tenta preencher campos com credenciais ja salvas no navegador.
const fillSavedBrowserCredential = async (usernameInput, passwordInput) => {
  try {
    if (!window.PasswordCredential || !navigator.credentials?.get) {
      return;
    }

    const credential = await navigator.credentials.get({
      password: true,
      mediation: "optional",
    });

    if (!credential) {
      return;
    }

    const credentialUser = credential.id?.replace(/@nutrihouse\.intra$/i, "") || "";
    const currentUser = usernameInput?.value.trim() || "";
    const credentialMatchesCurrentUser =
      !currentUser ||
      currentUser.toLowerCase() === credentialUser.toLowerCase() ||
      currentUser.toLowerCase() === credential.id?.toLowerCase();

    if (usernameInput && credentialUser && credentialMatchesCurrentUser) {
      usernameInput.value = credentialUser;
    }

    if (
      passwordInput &&
      !passwordInput.value &&
      credential.password &&
      credentialMatchesCurrentUser
    ) {
      passwordInput.value = credential.password;
    }
  } catch {
    // O autocomplete nativo continua disponivel mesmo sem suporte a Credentials API.
  }
};

// Consulta o cookie HttpOnly pelo backend; o frontend nunca le o token diretamente.
const getRememberedSessionUsername = async () => {
  try {
    const response = await fetch("/api/remember-session", {
      credentials: "include",
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    return data.remembered && typeof data.username === "string" ? data.username : "";
  } catch {
    return "";
  }
};

const Login = () => {
  // Guarda o usuario inicial para o campo continuar compativel com autofill do navegador.
  const [rememberedUser] = useState(getRememberedUser);
  const [rememberUser, setRememberUser] = useState(() => Boolean(rememberedUser));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const restoreRememberedAccess = async () => {
      const username = await getRememberedSessionUsername();

      if (!isActive || !username) {
        return;
      }

      try {
        localStorage.setItem("username", username);
      } catch {
        // O cookie HttpOnly segue valido mesmo se o storage local estiver bloqueado.
      }

      navigate("/home", { replace: true });
    };

    restoreRememberedAccess();

    // Primeiro deixa o navegador tentar preencher usuario e senha juntos.
    fillSavedBrowserCredential(
      usernameInputRef.current,
      passwordInputRef.current
    );

    // Depois, se o navegador nao preencher nada, aplica o usuario lembrado pelo app.
    const rememberedUserTimer = window.setTimeout(() => {
      if (usernameInputRef.current && !usernameInputRef.current.value) {
        usernameInputRef.current.value = rememberedUser;
      }
    }, 600);

    return () => {
      isActive = false;
      window.clearTimeout(rememberedUserTimer);
    };
  }, [navigate, rememberedUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const loginForm = e.currentTarget;
    setError("");
    setLoading(true);

    try {
      // FormData captura valores preenchidos pelo autocomplete mesmo sem evento onChange.
      const formData = new FormData(loginForm);
      const typedUser = String(formData.get("username") || "");
      const typedPassword = String(formData.get("password") || "");

      // Remove espacos antes/depois para evitar montar um DN invalido no LDAP.
      const normalizedUser = typedUser.trim();

      if (!normalizedUser) {
        setError("Informe o usuário");
        return;
      }

      if (!typedPassword) {
        setError("Informe a senha");
        return;
      }

      // A autenticacao continua no backend/LDAP; o frontend apenas envia as credenciais.
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userDN: `${normalizedUser}@nutrihouse.intra`,
          password: typedPassword,
          rememberLogin: rememberUser,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          localStorage.setItem("username", data.username);
        } catch {
          // O storage e apenas conveniencia de interface; nao deve bloquear o acesso.
        }

        // O checkbox lembra acesso no backend e mantem o usuario como conveniencia.
        saveRememberedUser(rememberUser ? normalizedUser : "");
        if (rememberUser) {
          if (usernameInputRef.current) {
            usernameInputRef.current.value = normalizedUser;
          }
          await promptBrowserPasswordSave(loginForm);
        }
        navigate("/home");
      } else if (
        data.message?.toLowerCase().includes("senha") ||
        data.message?.toLowerCase().includes("password")
      ) {
        setError("Senha incorreta");
      } else if (
        data.message?.toLowerCase().includes("usuario") ||
        data.message?.toLowerCase().includes("usuário") ||
        data.message?.toLowerCase().includes("user")
      ) {
        setError("Usuário não encontrado");
      } else {
        setError("Falha na autenticação");
      }
    } catch {
      setError("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F7] px-4 py-8">
      <img
        src={OndaTop}
        alt=""
        className="pointer-events-none absolute left-0 top-0 z-0 h-[22%] max-w-[70%] object-contain sm:h-[30%] sm:max-w-[50%]"
      />

      <img
        src={OndaBottom}
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-[22%] max-w-[70%] object-contain sm:h-[30%] sm:max-w-[50%]"
      />

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-lg bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] p-5 text-center shadow-lg sm:p-6">
        <img
          src={Logo}
          alt="Logo NutriHouse"
          className="mb-[-16px] w-44 sm:w-[200px]"
        />

        <h1 className="mt-1 text-2xl font-semibold text-white">Bem-vindo</h1>
        <p className="mb-4 text-sm text-white">Acesse com seu usuário:</p>

        {/* method/action e autocomplete ajudam o navegador a reconhecer o login. */}
        <form
          onSubmit={handleLogin}
          method="post"
          action="/api/authenticate"
          className="flex w-full flex-col gap-4"
          autoComplete="on"
        >
          <div className="text-center">
            <label htmlFor="usuario" className="mb-1 block font-medium text-white">
              Usuário:
            </label>
            {/* name/autocomplete permitem que gerenciadores reconhecam o usuario. */}
            <input
              id="usuario"
              name="username"
              ref={usernameInputRef}
              type="text"
              placeholder="Digite seu usuário"
              className="w-full max-w-[265px] rounded-full border-none p-2 outline-none focus:ring-2 focus:ring-yellow-300"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              required
            />
          </div>

          <div className="text-center">
            <label htmlFor="senha" className="mb-1 block font-medium text-white">
              Senha:
            </label>
            {/* A senha pode ser preenchida/salva pelo navegador, nao pelo app. */}
            <input
              id="senha"
              name="password"
              ref={passwordInputRef}
              type="password"
              placeholder="Digite sua senha"
              className="w-full max-w-[265px] rounded-full border-none p-2 outline-none focus:ring-2 focus:ring-yellow-300"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Esta opcao lembra o acesso no backend sem expor a senha LDAP. */}
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
