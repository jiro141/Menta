import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await login(email, password);
      toast.success("¡Bienvenido a Menta!");
      navigate("/app/board");
    } catch (error) {
      toast.error(error.message || "Credenciales inválidas");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>
        <p className="mt-2 text-slate-400">Bienvenido a Menta</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Correo"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-400">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
