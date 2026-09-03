import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Trash2, Upload } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import { useUsuario } from "../contexts/UsuarioContext";
import { asArray, fetchJson } from "../utils/app";

const getMaterialUrl = (caminho) => {
  const value = String(caminho || "").trim();
  if (!value) return "#";

  const cleanPath = value.replace(/\\/g, "/");
  if (/^(https?:)?\/\//.test(cleanPath) || cleanPath.startsWith("/")) {
    return cleanPath;
  }

  return `/${cleanPath}`;
};

const MaterialPage = () => {
  const { id } = useParams();
  const { isAdmin } = useUsuario();
  const fileInputRef = useRef(null);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  useEffect(() => {
    let active = true;

    setTitulo("");
    setDescricao("");
    setPdfFile(null);
    setUploadError("");
    setUploadSuccess("");
    setDeleteError("");
    setDeleteSuccess("");
    setDeletingMaterialId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    async function getMateriais() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchJson(`/api/materiais/${encodeURIComponent(id)}`);

        if (active) setMateriais(asArray(data));
      } catch (err) {
        if (active) {
          console.error("Erro ao carregar materiais:", err);
          setMateriais([]);
          setError(err.message || "Nao foi possivel carregar os materiais.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    getMateriais();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmitMaterial(event) {
    event.preventDefault();

    if (!pdfFile) {
      setUploadError("Selecione um PDF para enviar.");
      setUploadSuccess("");
      return;
    }

    if (pdfFile.type && pdfFile.type !== "application/pdf") {
      setUploadError("Envie um arquivo PDF valido.");
      setUploadSuccess("");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");
      setDeleteError("");
      setDeleteSuccess("");

      const formData = new FormData();
      formData.append("pdf", pdfFile);

      const cleanTitle = titulo.trim();
      const cleanDescription = descricao.trim();

      if (cleanTitle) formData.append("titulo", cleanTitle);
      if (cleanDescription) formData.append("descricao", cleanDescription);

      const data = await fetchJson(`/api/materiais/${encodeURIComponent(id)}`, {
        method: "POST",
        body: formData,
      });

      if (data.material) {
        setMateriais((prev) =>
          [...prev, data.material].sort((a, b) =>
            String(a.titulo || "").localeCompare(String(b.titulo || "")),
          ),
        );
      }

      setTitulo("");
      setDescricao("");
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSuccess(data.message || "PDF salvo com sucesso.");
    } catch (err) {
      console.error("Erro ao enviar PDF:", err);
      setUploadError(err.message || "Nao foi possivel enviar o PDF.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMaterial(material) {
    const materialId = material?.id;

    if (!isAdmin || id === null || id === undefined || materialId === null || materialId === undefined) {
      return;
    }

    const confirmed = window.confirm("Deseja realmente deletar este material?");
    if (!confirmed) return;

    const materialIdText = String(materialId);

    try {
      setDeletingMaterialId(materialIdText);
      setDeleteError("");
      setDeleteSuccess("");

      const data = await fetchJson(
        `/api/materiais/${encodeURIComponent(id)}/${encodeURIComponent(materialIdText)}`,
        { method: "DELETE" },
      );

      setMateriais((prev) =>
        prev.filter((item) => String(item.id) !== materialIdText),
      );
      setDeleteSuccess(data.message || "PDF deletado com sucesso.");
    } catch (err) {
      console.error("Erro ao deletar material:", err);
      setDeleteError(err.message || "Nao foi possivel deletar o material.");
    } finally {
      setDeletingMaterialId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FFFFFF] font-[Poppins,sans-serif]">
      <Sidebar showButton={false} />

      <section className="w-full px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
          <h1 className="mb-8 break-words text-center text-2xl font-bold sm:text-3xl md:mb-10">
            Materiais de Apoio
          </h1>

          {isAdmin && (
            <form
              onSubmit={handleSubmitMaterial}
              className="mb-8 grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-2"
            >
              <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700">
                Titulo
                <input
                  type="text"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Nome do material"
                  className="min-h-11 rounded-md border border-black/10 px-3 text-sm font-medium outline-none transition focus:border-[#B95758] focus:ring-2 focus:ring-[#B95758]/20"
                />
              </label>

              <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700">
                Descricao
                <input
                  type="text"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descricao opcional"
                  className="min-h-11 rounded-md border border-black/10 px-3 text-sm font-medium outline-none transition focus:border-[#B95758] focus:ring-2 focus:ring-[#B95758]/20"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:col-span-2">
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700">
                  PDF
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      setPdfFile(event.target.files?.[0] || null);
                      setUploadError("");
                      setUploadSuccess("");
                    }}
                    className="min-h-11 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[#F0F0E9] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#B95758] focus:border-[#B95758] focus:ring-2 focus:ring-[#B95758]/20"
                  />
                </label>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#B95758] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f3f40] disabled:cursor-not-allowed disabled:opacity-70 sm:self-end"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploading ? "Enviando..." : "Enviar PDF"}
                </button>
              </div>

              {(uploadError || uploadSuccess) && (
                <p
                  className={`text-sm font-semibold lg:col-span-2 ${uploadError ? "text-[#B95758]" : "text-green-700"
                    }`}
                >
                  {uploadError || uploadSuccess}
                </p>
              )}
            </form>
          )}

          {isAdmin && (deleteError || deleteSuccess) && (
            <p
              className={`mb-4 text-center text-sm font-semibold ${
                deleteError ? "text-[#B95758]" : "text-green-700"
              }`}
            >
              {deleteError || deleteSuccess}
            </p>
          )}

          {loading ? (
            <p className="text-center text-base text-gray-500 sm:text-lg">
              Carregando materiais...
            </p>
          ) : error ? (
            <p className="text-center text-base text-[#B95758] sm:text-lg">
              {error}
            </p>
          ) : materiais.length === 0 ? (
            <p className="text-center text-base text-gray-500 sm:text-lg">
              Nenhum material disponivel para este curso.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {materiais.map((material) => (
                <div
                  key={material.id || material.caminho}
                  className="flex flex-col items-center rounded-lg bg-white p-5 text-center shadow-lg transition duration-300 hover:shadow-xl sm:p-6"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                    alt="Material"
                    className="mb-4 w-16 sm:w-20"
                  />
                  <h2 className="mb-2 break-words font-semibold text-gray-800">
                    {material.titulo}
                  </h2>
                  <p className="mb-4 text-sm text-gray-500">{material.tipo}</p>
                  <div className="mt-auto flex w-full items-center justify-center gap-2">
                    <a
                      href={getMaterialUrl(material.caminho)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#B95758] px-5 py-2 font-medium text-white transition duration-300 hover:bg-[#e14d3a]"
                    >
                      Baixar
                    </a>

                    {isAdmin && material.id !== null && material.id !== undefined && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(material)}
                        disabled={deletingMaterialId === String(material.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B95758]/25 text-[#B95758] transition hover:bg-[#B95758]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Deletar ${material.titulo || "material"}`}
                        title="Deletar material"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MaterialPage;
