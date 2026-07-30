const Input = (props) => {
  return (
    <input
      {...props}
      // Garante uma area de toque consistente nos formularios em celulares.
      className="min-h-11 w-full rounded-md bg-white px-3 py-2 text-base text-[#23221d] placeholder-amber-600 outline-none"
    />
  );
};

export default Input;
