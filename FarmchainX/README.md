# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google Sign-In Setup

1. Create a Google OAuth Web Client in Google Cloud Console.
2. Add your frontend origin (for local: `http://localhost:5173`) to Authorized JavaScript origins.
3. Configure these environment variables:

Frontend (`FarmchainX/.env`):

```env
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
```

Backend (`backend/src/main/resources/application.properties` or env):

```env
GOOGLE_OAUTH_CLIENT_ID=your_google_web_client_id
```

When both are set, the "Continue with Google" option on `login` and `register` pages will authenticate using `/api/auth/google`.

