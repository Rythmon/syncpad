import dynamic from 'next/dynamic';

const EditorPage = dynamic(
  () => import('@/components/Editor/EditorPage').then((m) => m.EditorPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen bg-[#1c1e29] text-white items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#4aed88] border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Initializing collaborative workspace...</span>
        </div>
      </div>
    ),
  }
);

interface DocPageRouteProps {
  params: {
    id: string;
  };
}

export default function DocPageRoute({ params }: DocPageRouteProps) {
  const roomId = params.id || 'workspace-main';
  return <EditorPage roomId={roomId} />;
}
