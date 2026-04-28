import React from "react";
import Logo from "../assets/logos/logo_branca.png";
import Instagram from "../assets/images/instagram.png";
import Linkedin from "../assets/images/linkedin.png";

const Footer = () => {
  return (
    <footer className="bg-[#80B5B4] border-t w-full py-6">
      <div className="grid md:grid-cols-3 gap-16 text-gray-700 w-full justify-items-center px-4">
        {/* Coluna 1 - Logo e direitos */}
        <div className="flex flex-col items-center md:items-start">
          <img src={Logo} alt="NutriHouse Logo" className="w-24 mb-5" />
          <span className="text-sm">
            © {new Date().getFullYear()} NutriHouse. Todos os direitos reservados.
          </span>
        </div>

        {/* Coluna 2 - Contato */}
        <div>
          <h4 className="font-bold mb-3">Contato</h4>
          <p className="text-sm">Email: suporte@nutrihouse.com</p>
        </div>

        {/* Coluna 3 - Redes sociais */}
        <div>
          <h4 className="font-bold mb-3">Redes sociais</h4>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/nutrihousequalidade/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={Instagram} alt="Instagram" className="w-8 h-8" />
            </a>
            <a
              href="https://www.linkedin.com/company/nutrihouse/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={Linkedin} alt="LinkedIn" className="w-8 h-8" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
