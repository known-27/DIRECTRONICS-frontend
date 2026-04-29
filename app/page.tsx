import { redirect } from 'next/navigation';

// Root — the middleware handles all routing logic.
// Authenticated users hitting /login get forwarded to their role dashboard.
export default function RootPage() {
  redirect('/login');
}
