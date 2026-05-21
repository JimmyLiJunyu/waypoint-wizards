import Link from "next/link";
import LoginForm from "@/components/login/LoginForm";

function Login() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-[20vh] bg-[#F9F9F9]">
      <h1 className="color-black text-4xl font-bold">Welcome Back!</h1>
      <LoginForm />
    </main>
  );
}

export default Login;
