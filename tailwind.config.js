/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}, ./*.html", "./index.html", "./src/*.ts"],
  theme: {
    extend: {
      screens: {
        xs: "512px",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(1)", opacity: "0" },
        },
      },
      animation: {
        wiggle2: "wiggle 1s ease-in-out infinite",
        ping2: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
