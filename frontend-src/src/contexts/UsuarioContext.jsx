import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  clearStoredSession,
  getStoredUser,
  saveStoredSession,
} from "../utils/app";

const UsuarioContext = createContext(null);

export const UsuarioProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(getStoredUser);

  const atualizarUsuario = useCallback((data = {}) => {
    saveStoredSession(data);
    const nextUsuario = getStoredUser();
    setUsuario(nextUsuario);
    return nextUsuario;
  }, []);

  const limparUsuario = useCallback(() => {
    clearStoredSession();
    const nextUsuario = getStoredUser();
    setUsuario(nextUsuario);
    return nextUsuario;
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      atualizarUsuario,
      limparUsuario,
      isAdmin: usuario.isAdmin,
    }),
    [atualizarUsuario, limparUsuario, usuario],
  );

  return (
    <UsuarioContext.Provider value={value}>{children}</UsuarioContext.Provider>
  );
};

export const useUsuario = () => {
  const context = useContext(UsuarioContext);

  if (!context) {
    throw new Error("useUsuario deve ser usado dentro de UsuarioProvider");
  }

  return context;
};