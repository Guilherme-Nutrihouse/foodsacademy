import React from "react";

const SearchBar = ({ value, onChange }) => {
  const handleClear = () => {
    onChange("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onChange("");
      e.target.blur();
    }
  };

  return (
    <div className="relative ml-2">
      <input
        type="text"
        placeholder="Buscar cursos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-[320px] px-4 py-2 pr-10 rounded-full border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
      />

      {/* Ícone lupa (quando vazio) */}
      {!value && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.23-5.4a6.63 6.63 0 11-13.26 0 6.63 6.63 0 0113.26 0z"
          />
        </svg>
      )}

      {/* Botão limpar (quando tem texto) */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                     hover:text-gray-800 transition"
          aria-label="Limpar busca"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
