/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      transformOrigin: {
        "0": "0%"
      },
      zIndex: {
        "-1": "-1"
      }
    },
  },
  plugins: [],
  variants: {
    borderColor: ['responsive','hover','focus','focus-within']
  }
}
