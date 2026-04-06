'use client'

import { useRouter } from 'next/navigation'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'

import LoginForm from '@/components/ui/login-form'

const Login = () => {
  const { signInWithGoogle } = useAuth()
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const handleGoogleSignIn = async () => {
    setGoogleError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch {
      setGoogleError('Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <Card className='z-1 w-full border-none shadow-md sm:max-w-lg'>
        <CardHeader className='gap-6'>
          <div>
            <CardTitle className='mb-1.5 text-2xl'>Log In to Job Application Tracker</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {/* Login Form */}
          <div className='space-y-4'>
            <LoginForm />

            <p className='text-muted-foreground text-center'>
              New to our platform?{' '}
              <a href='/register' className='text-card-foreground hover:underline'>
                Create an account
              </a>
            </p>

            <div className='flex items-center gap-4'>
              <Separator className='flex-1' />
              <p>or</p>
              <Separator className='flex-1' />
            </div>

            {googleError && (
              <div className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                {googleError}
              </div>
            )}

            <Button
              variant='ghost'
              className='w-full'
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Log in with Google'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
