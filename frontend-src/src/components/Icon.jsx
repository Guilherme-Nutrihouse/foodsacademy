const paths = {
  back: ["M15 18l-6-6 6-6"],
  check: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "m9 12 2 2 4-4"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  left: ["M12 19l-7-7 7-7"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  right: ["M9 5l7 7-7 7"],
  search: ["M21 21l-4.35-4.35m1.23-5.4a6.63 6.63 0 1 1-13.26 0 6.63 6.63 0 0 1 13.26 0z"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
};

const Icon = ({ name, className = "h-5 w-5", strokeWidth = 2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
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
