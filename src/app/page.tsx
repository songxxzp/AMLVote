import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to Chinese version by default
  redirect('/zh');
}