import dynamic from 'next/dynamic';
import { EditorSkeleton } from '@/components/Editor/EditorSkeleton';

const DocumentRoomView = dynamic(
  () => import('@/components/DocumentRoomView').then((m) => m.DocumentRoomView),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

export default function HomePage() {
  return <DocumentRoomView roomId="workspace-main" />;
}
