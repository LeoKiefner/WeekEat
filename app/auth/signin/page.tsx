import { SignInForm } from "@/components/forms/signin-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}
