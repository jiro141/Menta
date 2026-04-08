import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await register(email, password);
      toast.success("¡Cuenta creada! Ahora puedes iniciar sesión");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Error al crear la cuenta");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-slate-400">Empieza a organizarte con Menta</p>
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
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrarme"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-400">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
