import { requireContext } from '@/lib/session';
import { Shell } from '@/components/layout/shell';
export const dynamic = 'force-dynamic';
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  return (
    <Shell workspaceName={ctx.workspaceName} userName={ctx.user.name}>
      {children}
    </Shell>
  );
}
