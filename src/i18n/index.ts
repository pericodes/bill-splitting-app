import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "welcome.title": "Equilibrium",
      "welcome.subtitle": "Simple, fast, reliable financial management.",
      "welcome.login": "Login",
      "welcome.signup": "Create Account",
      "welcome.username": "Username",
      "welcome.access": "Access Account",
      "welcome.fullname": "Full Name",
      "welcome.create": "Create Profile",
      "dashboard.title": "Shared Expenses",
      "dashboard.my_accounts": "My Accounts",
      "dashboard.subtitle": "Manage your recent shared expenses",
      "dashboard.create_account": "Create new account",
      "dashboard.total_balance": "Total balance",
      "dashboard.updated": "Updated",
      "nav.accounts": "Accounts",
      "nav.activities": "Activities",
      "nav.profile": "Profile",
    }
  },
  es: {
    translation: {
      "welcome.title": "Equilibrium",
      "welcome.subtitle": "Gestión financiera simple, rápida y confiable.",
      "welcome.login": "Iniciar Sesión",
      "welcome.signup": "Crear Cuenta",
      "welcome.username": "Usuario",
      "welcome.access": "Acceder a la cuenta",
      "welcome.fullname": "Nombre Completo",
      "welcome.create": "Crear Perfil",
      "dashboard.title": "Gastos Compartidos",
      "dashboard.my_accounts": "Mis Cuentas",
      "dashboard.subtitle": "Gestiona tus gastos compartidos recientes",
      "dashboard.create_account": "Crear nueva cuenta",
      "dashboard.total_balance": "Saldo total",
      "dashboard.updated": "Actualizado",
      "nav.accounts": "Cuentas",
      "nav.activities": "Actividades",
      "nav.profile": "Perfil",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default to english as requested
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
