import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/themeProvider.tsx";
import Footer from "./components/Footer.tsx";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Toaster } from "sonner";
import { Appbar } from "./components/Appbar.tsx";
import { BrowserRouter } from "react-router-dom";
import "./lib/api";
import { SOLANA_RPC_URL } from "./config.ts";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark">
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <Toaster />
            <Appbar />
            <App />
            <Footer />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </ThemeProvider>,
);
