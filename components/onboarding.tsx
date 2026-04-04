'use client'

import { useState } from 'react'

import { CircleDashedIcon, LogIn, ImportIcon, PlusIcon, CircleCheckIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const items = [
  {
    title: 'Sign up and create an account',
    content: `To get started, create an account or log in with your existing account.`,
    icon: LogIn,
    label: 'Sign up'
  },
  {
    title: 'Add your job applications',
    content: 'Input your job applications to start tracking your progress.',
    icon: ImportIcon,
    label: 'Import'
  },
  {
    title: 'Manage your applications',
    content: 'Drag and drop your job applications to organize them.',
    icon: PlusIcon,
    label: 'Create'
  }
]

type OnboardingFeedProps = {
  onContinue?: () => void
  onCancel?: () => void
}

function OnboardingFeed({ onContinue, onCancel }: OnboardingFeedProps) {
  const [active, setActive] = useState<string>('item-1')
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const isAllCompleted = completed.size === items.length

  const handleOpenChange = (val: string) => {
    setActive(val)
  }

  const handleComplete = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev)

      next.add(index)

      return next
    })

    const nextIndex = index + 1

    if (nextIndex < items.length) {
      setActive(`item-${nextIndex + 1}`)
    } else {
      setActive('')
    }
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>Let&apos;s set up your job application tracker</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <Accordion
          type='single'
          collapsible
          className='w-full space-y-2'
          value={active}
          onValueChange={handleOpenChange}
        >
          {items.map((item, index) => {
            const Icon = item.icon
            const isCompleted = completed.has(index)

            return (
              <AccordionItem key={index} value={`item-${index + 1}`} className='rounded-md border!'>
                <AccordionTrigger className='px-5'>
                  <span className='flex items-center gap-2'>
                    {isCompleted ? (
                      <CircleCheckIcon className='size-4 shrink-0' />
                    ) : (
                      <CircleDashedIcon className='size-4 shrink-0' />
                    )}
                    <span>{item.title}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground flex flex-col items-start gap-2 px-5'>
                  {item.content}
                  <Button
                    size='sm'
                    onClick={() => handleComplete(index)}
                    disabled={isCompleted || !(index === 0 || completed.has(index - 1))}
                  >
                    <Icon className='size-4 shrink-0' />
                    {item.label}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        <div className='flex justify-end gap-2'>
          <Button className='flex-1 max-sm:w-full' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className='flex-1 max-sm:w-full'
            type='button'
            onClick={onContinue}
            disabled={!isAllCompleted}
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnboardingFeed
