import React from "react";

const SearchBar = ({ value = "", onChange = () => {}, className = "" }) => {
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
    <div className={`relative w-full min-w-0 ${className}`}>
      <input
        type="text"
        placeholder="Buscar cursos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 rounded-full border border-gray-300 px-4 py-2 pr-10 transition focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />

      {!value && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m1.23-5.4a6.63 6.63 0 11-13.26 0 6.63 6.63 0 0113.26 0z"
          />
        </svg>
      )}

      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:text-gray-800"
          aria-label="Limpar busca"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
