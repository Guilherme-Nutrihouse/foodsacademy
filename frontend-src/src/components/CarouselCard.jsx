import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const CarouselCard = ({ id, title, icon, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/video/${id}`);
  };

return (
    <button
      onClick={handleClick}
      className="flex flex-row items-center justify-start 
    bg-[linear-gradient(135deg,_#B95758,_#e14d3a)]   
    text-white shadow-xl font-poppins text-lg rounded-2xl 
    w-72 h-44 sm:w-80 sm:h-40 p-8 mx-2 transition-transform 
    hover:scale-105 hover:shadow-2xl duration-200"
>
      {/* Ícone do curso */}
      <img
        src={icon || "/img/default-course-icon.png"}
        alt={title}
        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg mr-4"

      />

      {/* Título */}
      <h1 className="font-semibold text-base sm:text-lg leading-snug flex-1">
        {title}
      </h1>
    </button>
  );
};

export default CarouselCard;
