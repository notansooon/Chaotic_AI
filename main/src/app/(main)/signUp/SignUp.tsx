
"use client"


import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/BlackButton'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Strong, Text, TextLink } from '@/components/text'
import { Logo } from '@/components/Logo'
import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

import { useState } from 'react'

export default function Example() {

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();



  const onSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    
    const {error} = await authClient.signUp.email({
      name: name,
      email: email, 
      password: password, 
      callbackURL: '/email-verified'
  
    })

    if (error) {
      alert(error.message);
      
      console.error(error);
    }
    else {
      router.push('/');
    }


  }
  return (
    <AuthLayout>
      <form action="#" onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Create your account</Heading>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" onChange={(e) => {setEmail(e.target.value)}} />
        </Field>
        <Field>
          <Label>Full name</Label>
          <Input name="name" onChange={(e) => setName(e.target.value)}/>
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type="password" name="password" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <CheckboxField>
          <Checkbox name="remember" />
          <Label>Get emails about product updates and news.</Label>
        </CheckboxField>
        <Button type="submit" className="w-full">
          Create account
        </Button>
        <Text>
          Already have an account?{' '}
          <TextLink href="/login">
            <Strong>Sign in</Strong>
          </TextLink>
        </Text>
      </form>
    </AuthLayout>
  )
}