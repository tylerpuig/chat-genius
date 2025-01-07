import { LoginForm } from '../../_components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gray-800 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}
