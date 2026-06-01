import React from "react";
import Icon from "./Icon";

const SearchBar = ({ value = "", onChange = () => {}, className = "" }) => {
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
        <Icon
          name="search"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
        />
      )}

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:text-gray-800"
          aria-label="Limpar busca"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
