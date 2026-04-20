/* disable eslint for this file */
/* eslint-disable */
import { RegisterForm } from '@/components/auth/register-form'
import { Suspense } from 'react'

export const metadata = {
  title: 'Register — Fetch Fitness',
}

export default function RegisterPage() {
  return <Suspense fallback={<div>Loading...</div>}></Suspense> 
}
