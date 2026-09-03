import React, { useEffect, useState } from "react";
import logoSource from "../assets/logos/logo_novo.png";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const COMPANY_NAME = "MCP REFEICOES LTDA ME";
const COMPANY_CNPJ = "06.088.039/0001-99";
const DATE_OPTIONS = { day: "2-digit", month: "2-digit", year: "numeric" };
const LOGO_MAX_WIDTH = 95;
const LOGO_MAX_HEIGHT = 95;
const LOGO_SOURCE_MAX_SIZE = 285;

let logoImagePromise;

const winAnsiSpecialChars = {
  "€": 0x80,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "™": 0x99,
};

const encodeWinAnsi = (value) => {
  const bytes = [];

  const text = String(value || "").normalize("NFC");

  for (const char of text) {
    const code = char.codePointAt(0);

    if (winAnsiSpecialChars[char]) {
      bytes.push(winAnsiSpecialChars[char]);
    } else if (code <= 0xff) {
      bytes.push(code);
    } else {
      bytes.push(0x3f);
    }
  }

  return bytes;
};

const toPdfText = (value) =>
  `<${encodeWinAnsi(value)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}>`;

const fontFamilyByPdfFont = {
  F1: "Arial",
  F2: "Arial",
  F3: "Times New Roman",
};

const fontWeightByPdfFont = {
  F1: "normal",
  F2: "700",
  F3: "700",
};

let measureContext;

const getMeasureContext = () => {
  if (measureContext || typeof document === "undefined") return measureContext;

  const canvas = document.createElement("canvas");
  measureContext = canvas.getContext("2d");
  return measureContext;
};

const fallbackTextWidth = (text, fontSize, font = "F1") => {
  const value = String(text || "");
  const boldFactor = font === "F2" ? 1.08 : 1;
  const timesFactor = font === "F3" ? 1.04 : 1;

  return [...value].reduce((total, char) => {
    if (char === " ") return total + fontSize * 0.28;
    if (/[ilI.,:;|!]/.test(char)) return total + fontSize * 0.25;
    if (/[mwMW]/.test(char)) return total + fontSize * 0.82 * boldFactor * timesFactor;
    if (/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(char)) return total + fontSize * 0.68 * boldFactor * timesFactor;
    if (/[0-9]/.test(char)) return total + fontSize * 0.56 * boldFactor * timesFactor;
    return total + fontSize * 0.52 * boldFactor * timesFactor;
  }, 0);
};

const measureTextWidth = (text, fontSize, font = "F1") => {
  const context = getMeasureContext();

  if (!context) return fallbackTextWidth(text, fontSize, font);

  const family = fontFamilyByPdfFont[font] || fontFamilyByPdfFont.F1;
  const weight = fontWeightByPdfFont[font] || fontWeightByPdfFont.F1;
  context.font = `${weight} ${fontSize}px ${family}`;
  return context.measureText(String(text || "")).width;
};

const fitFontSize = (text, preferredSize, maxWidth, minSize = 12, font = "F1") => {
  let fontSize = preferredSize;

  while (fontSize > minSize && measureTextWidth(text, fontSize, font) > maxWidth) {
    fontSize -= 1;
  }

  return fontSize;
};

const centerText = (text, y, options = {}) => {
  const fontSize = options.fontSize || 12;
  const font = options.font || "F1";
  const color = options.color || "0 0 0";
  const x = (PAGE_WIDTH - measureTextWidth(text, fontSize, font)) / 2;

  return `BT /${font} ${fontSize} Tf ${color} rg ${x.toFixed(2)} ${y} Td ${toPdfText(text)} Tj ET`;
};

const rightText = (text, x, y, options = {}) => {
  const fontSize = options.fontSize || 8;
  const font = options.font || "F1";
  const color = options.color || "0 0 0";
  const left = x - measureTextWidth(text, fontSize, font);

  return `BT /${font} ${fontSize} Tf ${color} rg ${left.toFixed(2)} ${y} Td ${toPdfText(text)} Tj ET`;
};

const wrapText = (text, maxCharacters) => {

  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxCharacters && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);

  return lines.length ? lines : [""];
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.decoding = "async";
    image.src = src;
  });

const blobToBytes = async (blob) => new Uint8Array(await blob.arrayBuffer());

const canvasToJpegBytes = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Nao foi possivel processar a logo."));
          return;
        }

        resolve(blobToBytes(blob));
      },
      "image/jpeg",
      0.88,
    );
  });

const loadLogoImage = () => {
  if (!logoImagePromise) {
    logoImagePromise = loadImage(logoSource)
      .then(async (image) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const sourceScale = LOGO_SOURCE_MAX_SIZE / Math.max(image.width, image.height);
        const canvasWidth = Math.round(image.width * sourceScale);
        const canvasHeight = Math.round(image.height * sourceScale);
        const displayScale = Math.min(
          LOGO_MAX_WIDTH / image.width,
          LOGO_MAX_HEIGHT / image.height,
        );

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        return {
          bytes: await canvasToJpegBytes(canvas),
          width: canvasWidth,
          height: canvasHeight,
          displayWidth: image.width * displayScale,
          displayHeight: image.height * displayScale,
        };
      })
      .catch((error) => {
        console.error("Erro ao carregar logo do certificado:", error);
        return null;
      });
  }

  return logoImagePromise;
};

const textEncoder = new TextEncoder();

const toBytes = (value) =>
  value instanceof Uint8Array ? value : textEncoder.encode(String(value));

const appendChunk = (chunks, value) => {
  const bytes = toBytes(value);
  chunks.push(bytes);
  return bytes.length;
};

const buildPdfDocument = ({ content, logoImage }) => {
  const objects = [
    ["<< /Type /Catalog /Pages 2 0 R >>"],
    ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
    [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `,
      "/Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >>",
      logoImage ? " /XObject << /Logo 8 0 R >>" : "",
      " >> /Contents 4 0 R >>",
    ],
    [`<< /Length ${textEncoder.encode(content).length} >>\nstream\n${content}\nendstream`],
    ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"],
    ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"],
    ["<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>"],
  ];

  if (logoImage) {
    objects.push([
      `<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.bytes.length} >>\nstream\n`,
      logoImage.bytes,
      "\nendstream",
    ]);
  }

  const chunks = [];
  const offsets = [0];
  let position = appendChunk(chunks, "%PDF-1.4\n");

  objects.forEach((object, index) => {
    offsets[index + 1] = position;
    position += appendChunk(chunks, `${index + 1} 0 obj\n`);
    object.forEach((part) => {
      position += appendChunk(chunks, part);
    });
    position += appendChunk(chunks, "\nendobj\n");
  });

  const xrefOffset = position;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  appendChunk(chunks, xref);

  return new Blob(chunks, { type: "application/pdf" });
};

const createCertificatePdfBlob = ({ studentName, courseName, logoImage }) => {
  const safeStudentName = studentName || "Aluno";
  const safeCourseName = courseName || "Curso";

  const completionDate = new Date().toLocaleDateString("pt-BR", DATE_OPTIONS);

  const validationCode = window.crypto?.randomUUID?.() || `${Date.now()}`;
  const studentFontSize = fitFontSize(safeStudentName, 28, 700, 16, "F3");
  const courseLines = wrapText(safeCourseName, 54).slice(0, 2);
  const courseFontSize = fitFontSize(courseLines.join(" "), 20, 660, 14, "F2");
  const logoCommand = logoImage
    ? (() => {
        const displayWidth = logoImage.displayWidth || LOGO_MAX_WIDTH;
        const displayHeight = logoImage.displayHeight || LOGO_MAX_HEIGHT;
        const displayX = 58 + (LOGO_MAX_WIDTH - displayWidth) / 2;
        const displayY = 448 + (LOGO_MAX_HEIGHT - displayHeight) / 2;

        return `q ${displayWidth.toFixed(2)} 0 0 ${displayHeight.toFixed(2)} ${displayX.toFixed(2)} ${displayY.toFixed(2)} cm /Logo Do Q`;
      })()
    : "";

  const content = [
    "q",
    "1 1 1 rg 0 0 842 595 re f",
    "0.843 0.098 0.125 RG 3 w 28 28 786 539 re S",
    "0.898 0.898 0.898 RG 1 w 40 40 762 515 re S",
    "0.968 0.968 0.961 rg 58 95 726 58 re f",
    logoCommand,
    rightText("Certificado", 784, 529, { fontSize: 8, color: "0.4 0.4 0.4" }),
    centerText("CERTIFICADO", 445, { font: "F3", fontSize: 34, color: "0.09 0.09 0.09" }),
    centerText("DE CONCLUSÃO DE CURSO", 423, { font: "F2", fontSize: 10, color: "0.843 0.098 0.125" }),
    "0.843 0.098 0.125 rg 376 408 90 2 re f",
    centerText("Certificamos que", 360, { fontSize: 12, color: "0.4 0.4 0.4" }),
    centerText(safeStudentName, 322, { font: "F3", fontSize: studentFontSize, color: "0.843 0.098 0.125" }),
    centerText("concluiu o curso", 278, { fontSize: 12, color: "0.09 0.09 0.09" }),
    ...courseLines.map((line, index) =>
      centerText(line, 248 - index * 24, {
        font: "F2",
        fontSize: courseFontSize,
        color: "0.09 0.09 0.09",
      }),
    ),
    centerText("DATA DE CONCLUSÃO", 202, { font: "F2", fontSize: 8, color: "0.4 0.4 0.4" }),
    centerText(completionDate, 184, { fontSize: 11, color: "0.09 0.09 0.09" }),
    centerText("EMPRESA EMISSORA", 132, { font: "F2", fontSize: 7, color: "0.4 0.4 0.4" }),
    centerText(COMPANY_NAME, 116, { font: "F2", fontSize: 10, color: "0.09 0.09 0.09" }),
    centerText(`CNPJ: ${COMPANY_CNPJ}`, 101, { fontSize: 8, color: "0.4 0.4 0.4" }),
    rightText(`Código de validação: ${validationCode}`, 784, 58, { fontSize: 7, color: "0.4 0.4 0.4" }),
    "Q",
  ].filter(Boolean).join("\n");

  return buildPdfDocument({ content, logoImage });
};

const downloadBlob = (blob, fileName) => {

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function CertificateButton({
  studentName,
  courseName,
  className = "mt-4",
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLogoImage();
  }, []);

  const handleDownload = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError("");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    try {
      const logoImage = await loadLogoImage();
      const blob = createCertificatePdfBlob({ studentName, courseName, logoImage });
      downloadBlob(blob, "certificado.pdf");
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      setError("Não foi possível gerar o certificado.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full rounded-md bg-white py-2 text-center font-semibold text-[#B95758] shadow-sm transition hover:bg-gray-100 disabled:cursor-wait disabled:opacity-80"
      >
        {isGenerating ? "Gerando certificado..." : "Baixar certificado"}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-white">{error}</p>}
    </div>
  );
}
