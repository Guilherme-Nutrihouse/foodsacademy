import React from "react";
import Instagram from "../assets/images/instagram.png";
import Linkedin from "../assets/images/linkedin.png";
import Logo from "../assets/logos/logo_branca.png";

const links = [
  ["https://www.instagram.com/nutrihousequalidade/", Instagram, "Instagram"],
  [
    "https://www.linkedin.com/company/nutrihouse/posts/?feedView=all",
    Linkedin,
    "LinkedIn",
  ],
];

const Footer = () => (
  <footer className="w-full border-t bg-[#80B5B4] py-6">
    <div className="mx-auto grid w-full max-w-screen-xl gap-8 px-4 text-center justify-items-center text-gray-700 sm:px-6 md:grid-cols-3 md:text-left lg:px-8">
      <div className="flex flex-col items-center md:items-start text-center">
        <img src={Logo} alt="NutriHouse Logo" className="mb-4 w-24" />
        <span className="text-sm">
          &copy; {new Date().getFullYear()} NutriHouse. Todos os direitos
          reservados.
        </span>
      </div>

      <div>
        <h2 className="mb-3 font-bold">Contato</h2>
        <p className="break-words text-sm">Email: suporte@nutrihouse.com</p>
      </div>

      <div className="flex flex-col items-center md:items-start">
        <h2 className="mb-3 font-bold">Redes sociais</h2>
        <div className="flex gap-4">
          {links.map(([href, src, alt]) => (
            <a key={alt} href={href} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={alt} className="h-8 w-8" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
