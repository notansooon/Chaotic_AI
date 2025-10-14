

"use client"

import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/BlackButton'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { Logo } from '@/components/Logo'

import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

import { useState } from 'react'
export default function Example() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [remember, setRemember] = useState(false);




  const onSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here

    const { error } = await authClient.signIn.email({
      email: email, 
      password: password, 
      rememberMe: remember,
    })
    if (error) {
      alert(error.message);
      console.error(error);
    }
    else {
      router.push('/explore');
    }
  }
  return ( 
    <AuthLayout>
      <form action="#" method="POST" onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Sign in to your account</Heading>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" onChange={(e) => {
            setEmail(e.target.value);
          }}/>
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type="password" name="password" onChange={(e) => {
            setPassword(e.target.value);
          }}/>
        </Field>
        <div className="flex items-center justify-between">
          <CheckboxField>
            <Checkbox name="remember" />
            <Label>Remember me</Label>
          </CheckboxField>
          <Text>
            <TextLink href="/forgot-password">
              <Strong>Forgot password?</Strong>
            </TextLink>
          </Text>
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <Text>
          Don’t have an account?{' '}
          <TextLink href="#">
            <Strong>Sign up</Strong>
          </TextLink>
        </Text>
      </form>
    </AuthLayout>
  )
  }
