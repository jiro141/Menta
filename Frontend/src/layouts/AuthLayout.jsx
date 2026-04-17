import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}