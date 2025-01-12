'use client'
import { useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { signIn } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useToast } from '~/hooks/use-toast'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [loginLoading, setLoginLoading] = useState(false)

  async function tryLogin(e?: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    try {
      setLoginLoading(true)
      e?.preventDefault()
      e?.stopPropagation()
      console.log(emailRef.current?.value, passwordRef.current?.value)

      if (!emailRef.current?.value || !passwordRef.current?.value) return

      const result = await signIn('credentials', {
        email: emailRef.current.value,
        password: passwordRef.current.value,
        redirect: true,
        redirectTo: '/'
      })

      if (!result?.ok) {
        throw new Error('Failed to log in')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      // toast({
      //   title: 'Error',
      //   description: 'Failed to log in. Please try again.',
      //   duration: 4_000
      // })
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border-0 bg-gray-800 text-gray-100">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-white">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                {/* <Button
                  variant="outline"
                  className="w-full bg-gray-700 text-gray-200 hover:bg-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button> */}
                <Button
                  variant="default"
                  className="w-full border-0 bg-gray-700 text-gray-200 hover:bg-gray-600"
                  onClick={(e) => {
                    e.preventDefault()
                    signIn('discord', { redirectTo: '/' })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 48 48"
                  >
                    <radialGradient
                      id="La9SoowKGoEUHOnYdJMSEa_2mIgusGquJFz_gr1"
                      cx="24"
                      cy="10.009"
                      r="32.252"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stop-color="#8c9eff"></stop>
                      <stop offset=".368" stop-color="#889af8"></stop>
                      <stop offset=".889" stop-color="#7e8fe6"></stop>
                      <stop offset="1" stop-color="#7b8ce1"></stop>
                    </radialGradient>
                    <path
                      fill="url(#La9SoowKGoEUHOnYdJMSEa_2mIgusGquJFz_gr1)"
                      d="M40.107,12.15c-0.065-0.102-0.139-0.182-0.236-0.255c-0.769-0.578-4.671-3.339-9.665-3.875	c-0.01-0.001-0.048-0.003-0.057-0.003c-0.098,0-0.183,0.057-0.224,0.14l-0.269,0.538c0,0-0.001,0-0.001,0	c-0.017,0.033-0.026,0.071-0.026,0.111c0,0.109,0.07,0.202,0.168,0.236c0.006,0.002,0.048,0.011,0.063,0.014	c4.267,1.028,6.863,2.89,9.149,4.945c-4.047-2.066-8.044-4.001-15.009-4.001s-10.961,1.936-15.009,4.001	c2.286-2.055,4.882-3.917,9.149-4.945c0.015-0.004,0.057-0.012,0.063-0.014c0.098-0.034,0.168-0.127,0.168-0.236	c0-0.04-0.009-0.078-0.026-0.111c0,0-0.001,0-0.001,0l-0.269-0.538c-0.041-0.083-0.125-0.14-0.224-0.14	c-0.009,0-0.048,0.002-0.057,0.003c-4.994,0.536-8.896,3.297-9.665,3.875c-0.097,0.073-0.17,0.153-0.236,0.255	c-0.708,1.107-5.049,8.388-5.892,21.632c-0.009,0.142,0.04,0.289,0.135,0.395c4.592,5.144,11.182,5.752,12.588,5.823	c0.167,0.008,0.327-0.065,0.427-0.199l1.282-1.709c0.1-0.134,0.046-0.322-0.111-0.379c-2.705-0.986-5.717-2.7-8.332-5.706	C11.231,34.457,16.12,37,24,37s12.769-2.543,16.009-4.993c-2.616,3.006-5.627,4.719-8.332,5.706	c-0.157,0.057-0.211,0.245-0.111,0.379l1.282,1.709c0.101,0.134,0.26,0.208,0.427,0.199c1.407-0.072,7.996-0.679,12.588-5.823	c0.095-0.106,0.144-0.253,0.135-0.395C45.156,20.538,40.815,13.257,40.107,12.15z"
                    ></path>
                    <ellipse cx="30.5" cy="26" opacity=".05" rx="4.5" ry="5"></ellipse>
                    <ellipse cx="30.5" cy="26" opacity=".05" rx="4" ry="4.5"></ellipse>
                    <ellipse cx="30.5" cy="26" fill="#fff" rx="3.5" ry="4"></ellipse>
                    <ellipse cx="17.5" cy="26" opacity=".05" rx="4.5" ry="5"></ellipse>
                    <ellipse cx="17.5" cy="26" opacity=".05" rx="4" ry="4.5"></ellipse>
                    <ellipse cx="17.5" cy="26" fill="#fff" rx="3.5" ry="4"></ellipse>
                  </svg>
                  Login with Discord
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-gray-600">
                <span className="relative z-10 bg-gray-800 px-2 text-gray-400">
                  Or continue with email
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    className="border-0 bg-gray-700 text-gray-200 placeholder-gray-400"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="ml-auto text-sm text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    ref={passwordRef}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        await tryLogin()
                      }
                    }}
                    id="password"
                    type="password"
                    className="border-0 bg-gray-700 text-gray-200"
                  />
                </div>
                <Button
                  onClick={async (e) => await tryLogin(e)}
                  // type="submit"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
              <div className="flex justify-center gap-2 text-center text-sm text-gray-400">
                <span>Don&apos;t have an account?</span>
                <div
                  onClick={() => {
                    redirect('/auth/signup')
                  }}
                  className="cursor-pointer text-blue-400 underline underline-offset-4 hover:text-blue-300"
                >
                  Sign up
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-gray-500 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-blue-300">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
