import { Outlet, useLocation } from "react-router";
import App from "../App";
import AuthForm from "./AuthForm";
import Footer from "./Footer";
import Header from "./Header";

export default function SiteLayout() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="relative flex-1 pt-16">
        <div aria-hidden={isAuthRoute} inert={isAuthRoute}>
          {isAuthRoute ? <App /> : <Outlet />}
        </div>
        {isAuthRoute && <AuthForm />}
      </div>
      <Footer />
    </div>
  );
}
