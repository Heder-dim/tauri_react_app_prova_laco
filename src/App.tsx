import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [mensagem, setMensagem] = useState("");

  async function chamarRust() {
    try {
      const resposta = await invoke<string>("greet", {
        name: "Heder",
      });

      setMensagem(resposta);
    } catch (error) {
      console.error("Erro ao chamar o Rust:", error);
      setMensagem("Não foi possível executar o comando.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Tauri + React + Tailwind
        </h1>

        <button
          type="button"
          onClick={chamarRust}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500"
        >
          Chamar Rust
        </button>

        {mensagem && (
          <p className="mt-4 text-slate-300">
            {mensagem}
          </p>
        )}
      </div>
    </main>
  );
}

export default App;