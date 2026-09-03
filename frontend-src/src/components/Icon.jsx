const paths = {
  back: ["M15 18l-6-6 6-6"],
  check: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "m9 12 2 2 4-4"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  copy: [
    "M8 8h10v10H8z",
    "M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ],
  left: ["M12 19l-7-7 7-7"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  messageCircle: [
    "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-4-.99L3 20l1.13-4.69A8.5 8.5 0 1 1 21 11.5z",
  ],

  heart: [
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z",
  ],
  right: ["M9 5l7 7-7 7"],
  search: [
    "M21 21l-4.35-4.35m1.23-5.4a6.63 6.63 0 1 1-13.26 0 6.63 6.63 0 0 1 13.26 0z",
  ],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  sliders: [
    "M4 21v-7",
    "M4 10V3",
    "M12 21v-9",
    "M12 8V3",
    "M20 21v-5",
    "M20 12V3",
    "M2 14h4",
    "M10 8h4",
    "M18 16h4",
  ],
  star: [
    "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  ],
};

const Icon = ({
  name,
  className = "h-5 w-5",
  fill = "none",
  strokeWidth = 2,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >

    {paths[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

export default Icon;
