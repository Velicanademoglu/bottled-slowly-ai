import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-ocean-800 text-white shadow">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Bottled Slowly AI
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-ocean-600 hover:bg-ocean-500 rounded transition"
            >
              Çıkış
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link to="/login" className="px-3 py-1 hover:underline">Giriş</Link>
            <Link to="/register" className="px-3 py-1 bg-ocean-600 hover:bg-ocean-500 rounded transition">
              Kayıt
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
