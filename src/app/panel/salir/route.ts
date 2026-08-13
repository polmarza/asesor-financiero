import { NextResponse } from 'next/server';
import { crearClienteSesion } from '@/lib/supabase/sesion';

export async function POST(request: Request) {
  const supabase = await crearClienteSesion();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/panel/login', request.url));
}
