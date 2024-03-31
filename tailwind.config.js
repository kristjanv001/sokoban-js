/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}, ./*.html", "./index.html", "./src/*.ts"],
  theme: {
    extend: {
      screens: {
        xs: "512px",
      },
    },
  },
  plugins: [],
};
