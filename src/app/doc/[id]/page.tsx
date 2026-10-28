import dynamic from 'next/dynamic';
import { EditorSkeleton } from '@/components/Editor/EditorSkeleton';

const DocumentRoomView = dynamic(
  () => import('@/components/DocumentRoomView').then((m) => m.DocumentRoomView),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

interface DocPageProps {
  params: {
    id: string;
  };
}

export default function DocPage({ params }: DocPageProps) {
  const roomId = params.id || 'workspace-main';
  return <DocumentRoomView roomId={roomId} />;
}
