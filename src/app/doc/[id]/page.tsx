import { DocumentRoomView } from '@/components/DocumentRoomView';

interface DocPageProps {
  params: {
    id: string;
  };
}

export default function DocPage({ params }: DocPageProps) {
  const roomId = params.id || 'workspace-main';
  return <DocumentRoomView roomId={roomId} />;
}
