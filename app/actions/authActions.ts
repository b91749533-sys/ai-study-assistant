'use server';

import { loginUser, registerUser, logoutUser } from '@/services/authService';
import { redirect } from 'next/navigation';

export async function loginAction(email: string) {
  try {
    await loginUser(email);
  } catch (error) {
    return { error: (error as Error).message };
  }
  redirect('/dashboard');
}

export async function registerAction(email: string, username: string) {
  try {
    await registerUser(email, username);
  } catch (error) {
    return { error: (error as Error).message };
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  await logoutUser();
  redirect('/login');
}
