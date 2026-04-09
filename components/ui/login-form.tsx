'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const { signIn, sendPasswordReset } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string }
      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.')
          break
        default:
          setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Enter your email above first, then click Forgot Password.')
      return
    }

    setIsSendingReset(true)
    try {
      await sendPasswordReset(email.trim())
      setMessage('If an account exists for this email, a password reset link has been sent.')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string }
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/too-many-requests':
          setError('Too many reset attempts. Please try again later.')
          break
        default:
          setError('Could not send reset email. Please try again.')
      }
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {error && (
        <div className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error}
        </div>
      )}
      {message && (
        <div className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'>
          {message}
        </div>
      )}

      {/* Email */}
      <div className='space-y-1'>
        <Label htmlFor='userEmail' className='leading-5'>
          Email address
        </Label>
        <Input
          type='email'
          id='userEmail'
          placeholder='Enter your email address'
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div className='w-full space-y-1'>
        <Label htmlFor='password' className='leading-5'>
          Password
        </Label>
        <div className='relative'>
          <Input
            id='password'
            type={isVisible ? 'text' : 'password'}
            placeholder='••••••••••••••••'
            className='pr-9'
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button
            variant='ghost'
            size='icon'
            type='button'
            onClick={() => setIsVisible(prevState => !prevState)}
            className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
          </Button>
        </div>
      </div>

      {/* Remember Me and Forgot Password */}
      <div className='flex items-center justify-between gap-y-2'>
        <div className='flex items-center gap-3'>
          <Checkbox id='rememberMe' className='size-6' />
          <Label htmlFor='rememberMe' className='text-muted-foreground'>
            {' '}
            Remember Me
          </Label>
        </div>

        <Button
          type='button'
          variant='link'
          className='h-auto p-0'
          onClick={handleForgotPassword}
          disabled={isLoading || isSendingReset}
        >
          {isSendingReset ? 'Sending reset link...' : 'Forgot Password?'}
        </Button>
      </div>

      <Button className='w-full' type='submit' disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className='size-4 animate-spin' />
            Logging in...
          </>
        ) : (
          'Log In'
        )}
      </Button>
    </form>
  )
}

export default LoginForm
