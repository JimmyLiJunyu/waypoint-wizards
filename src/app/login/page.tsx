import LoginForm from "@/components/login/LoginForm";

export default function Login() {
  return (
    <main className="flex-1 bg-gradient-to-br from-white via-gray-50 to-red-50 flex items-center justify-center px-4 py-12 overflow-y-auto">
      <LoginForm />
    </main>
  );
}
