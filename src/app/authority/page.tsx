import { redirect } from 'next/navigation';

export default function AuthorityRootPage() {
  redirect('/authority/dashboard');
}
