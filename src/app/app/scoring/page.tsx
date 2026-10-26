import { redirect } from 'next/navigation';
// Preserve existing bookmarks; priority and its explanation now live in each lead's profile.
export default function Scoring() {
  redirect('/app/leads');
}
