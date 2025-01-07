'use client'
import { cn } from '~/lib/utils'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { api } from '~/trpc/react'
import { useRouter } from 'next/navigation'

export function SignupForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const signup = api.auth.emailSignUp.useMutation({
    onSuccess: () => {
      router.push('/auth/login')
    }
  })

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="bg-gray-800 text-gray-100">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-blue-400">Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const email = formData.get('email') as string
              const password = formData.get('password') as string
              const firstName = formData.get('first-name') as string
              const lastName = formData.get('last-name') as string

              if (!email || !password || !firstName || !lastName) return

              const fullName = `${firstName} ${lastName}`

              signup.mutate({ email, password, name: fullName })
            }}
          >
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="first-name" className="text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    name="first-name"
                    placeholder="John"
                    className="border-0 bg-gray-700 text-gray-200 placeholder-gray-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name" className="text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    name="last-name"
                    placeholder="Doe"
                    className="border-0 bg-gray-700 text-gray-200 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    className="border-0 bg-gray-700 text-gray-200 placeholder-gray-400"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    className="border-0 bg-gray-700 text-gray-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  Sign Up
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-gray-500 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-blue-300">
        By signing up, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
