import React, { useEffect, useMemo, useState } from "react";
import backgroundImage from "../assets/images/background_teknisa_page.png";
import Icon from "../components/Icon";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getStoredUsername } from "../utils/app";

const PAGE_SIZE = 10;

// Usa o proxy/reverse proxy primeiro e cai no backend local quando o dev server devolver 404.
const getLocalApiBase = () => {
  const configuredBase =
    typeof process !== "undefined" ? process.env.REACT_APP_API_URL : "";
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  const isLocalHost = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  );

  return isLocalHost ? `http://${window.location.hostname}:5000` : "";
};

// Busca contatos no endpoint relativo e tenta a porta do backend em desenvolvimento.
const fetchContacts = async () => {
  const response = await fetch("/api/contatos", {
    credentials: "include",
  });

  if (response.status !== 404) return response;

  const localApiBase = getLocalApiBase();
  if (!localApiBase) return response;

  return fetch(`${localApiBase}/api/contatos`, {
    credentials: "include",
  });
};

// Mantem a tela independente de utils para consumir somente a API de contatos.
const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Gera as iniciais exibidas no bloco vermelho de cada contato.
const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

// Monta o link do WhatsApp a partir do telefone salvo no banco.
const getWhatsappLink = (phone = "") => {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
};

// Copia o telefone sem depender de helpers externos.
const copyText = async (text) => {
  if (!navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

function Contatos() {
  const [contacts, setContacts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [department, setDepartment] = useState("todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [username] = useState(getStoredUsername);

  useEffect(() => {
    let active = true;

    // Busca a lista protegida pelo mesmo fluxo autenticado do backend.
    async function loadContacts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetchContacts();

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar os contatos.");
        }

        const data = await response.json();
        if (active) setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContacts();

    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          contacts
            .map((contact) => contact.departamento)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b)),
        ),
      ),
    [contacts],
  );

  const filteredContacts = useMemo(() => {
    const query = normalizeText(search.trim());

    return contacts.filter((contact) => {
      const matchesDepartment =
        department === "todos" || contact.departamento === department;
      const searchable = normalizeText(
        [
          contact.nome,
          contact.telefone,
          contact.tipo,
          contact.departamento,
        ].join(" "),
      );

      return matchesDepartment && (!query || searchable.includes(query));
    });
  }, [contacts, department, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContacts.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleContacts = filteredContacts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const closeAnd = (action) => {
    setIsMobileOpen(false);
    action();
  };

  useEffect(() => {
    setPage(1);
  }, [department, search]);

  async function handleCopy(contact) {
    const copied = await copyText(contact.telefone);
    if (!copied) return;

    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 1600);
  }

  // Garante retorno para a home quando nao houver historico interno disponivel.
  const voltar = () =>
    closeAnd(() => {
      if ((window.history.state?.idx ?? 0) > 0) {
        navigate(-1);
        return;
      }

      navigate("/home");
    });

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#FAF9F7] px-4 py-8 text-[#2f2926] sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 35%",
      }}
    >
      <Header username={username} />

      <section className="mx-auto pt-10 flex w-full max-w-[1190px] flex-col gap-3">
        {/* Filtros simples iguais ao visual enviado, sem depender do Header global. */}
        <div className="grid gap-3 pt-3 md:grid-cols-[auto_1fr_260px]">
          {/* Mantem o botao Voltar visivel e separado dos filtros. */}
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B95758] text-white shadow-sm transition hover:bg-[#9f3f40]"
          >
            <Icon name="back" className="h-5 w-5 text-white" strokeWidth={3} />
          </button>
          <label className="flex h-12 min-w-0 items-center gap-3 rounded-md border border-black/10 bg-white/80 px-4 shadow-sm backdrop-blur">
            <Icon name="search" className="h-5 w-5 shrink-0 text-[#6f625d]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, numero ou setor"
              className="w-full bg-transparent text-sm font-semibold text-[#2f2926] outline-none placeholder:text-[#9b928d]"
            />
          </label>

          <label className="flex h-12 min-w-0 items-center gap-3 rounded-md border border-black/10 bg-white/80 px-4 shadow-sm backdrop-blur">
            <Icon name="sliders" className="h-5 w-5 shrink-0 text-[#6f625d]" />
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full bg-transparent text-sm font-bold text-[#2f2926] outline-none"
            >
              <option value="todos">Todos os setores</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Lista renderizada a partir dos campos da tabela contatos. */}
        <div className="flex flex-col gap-3">
          {loading && (
            <div className="rounded-md bg-white/85 px-5 py-6 text-center text-sm font-semibold text-[#6f625d] shadow-sm">
              Carregando contatos...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md bg-white/85 px-5 py-6 text-center text-sm font-semibold text-[#9f3f40] shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && visibleContacts.length === 0 && (
            <div className="rounded-md bg-white/85 px-5 py-6 text-center text-sm font-semibold text-[#6f625d] shadow-sm">
              Nenhum contato encontrado.
            </div>
          )}

          {!loading &&
            !error &&
            visibleContacts.map((contact) => (
              <article
                key={contact.id}
                className="grid min-h-[96px] items-center gap-4 rounded-md bg-white/85 px-4 py-4 shadow-sm backdrop-blur sm:grid-cols-[64px_1fr_auto] sm:px-5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#B95758] text-base font-bold text-white shadow-sm">
                  {getInitials(contact.nome)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-medium text-[#403936]">
                    {contact.nome}
                  </h2>
                  <p className="mt-1 truncate text-sm text-[#6f625d]">
                    {contact.tipo}
                  </p>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
                  <span className="rounded-full bg-[#f0e7dc] px-3 py-2 text-xs font-bold text-[#8c5b21]">
                    {contact.departamento}
                  </span>

                  <strong className="min-w-[150px] text-sm text-[#2f2926]">
                    {contact.telefone}
                  </strong>

                  <a
                    href={getWhatsappLink(contact.telefone)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-md text-[#3d7773] transition hover:bg-[#f6efe9]"
                    aria-label={`Abrir WhatsApp de ${contact.nome}`}
                  >
                    <Icon name="messageCircle" className="h-6 w-6" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(contact)}
                    className="flex h-11 w-11 items-center justify-center rounded-md bg-[#B95758] text-white transition hover:bg-[#9f3f40]"
                    aria-label={`Copiar telefone de ${contact.nome}`}
                    title={copiedId === contact.id ? "Copiado" : "Copiar"}
                  >
                    <Icon
                      name={copiedId === contact.id ? "check" : "copy"}
                      className="h-5 w-5"
                    />
                  </button>
                </div>
              </article>
            ))}
        </div>

        {/* Paginacao local para manter 10 contatos por pagina como nas figuras. */}
        {!loading && !error && filteredContacts.length > 0 && (
          <footer className="flex flex-col gap-3 pt-3 text-sm font-bold text-[#ffffff] md:flex-row md:items-center md:justify-between">
            <span className="text-[#ffffff] text-sm font-bold">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredContacts.length)} de{" "}
              {filteredContacts.length} contatos
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80 text-[#B95758] shadow-sm transition hover:bg-white disabled:opacity-45"
                aria-label="Pagina anterior"
              >
                <Icon name="left" className="h-5 w-5" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`flex h-10 w-10 items-center justify-center rounded-md font-bold shadow-sm transition ${
                      item === currentPage
                        ? "bg-[#B95758] text-white"
                        : "bg-white/85 text-[#6f625d] hover:bg-white"
                    }`}
                    aria-label={`Ir para pagina ${item}`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(value + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80 text-[#B95758] shadow-sm transition hover:bg-white disabled:opacity-45"
                aria-label="Proxima pagina"
              >
                <Icon name="right" className="h-5 w-5" />
              </button>
            </div>
          </footer>
        )}
      </section>
    </main>
  );
}

export default Contatos;
