import { ScalesContainer } from "src/components/ui/scales";

export default function ScalesContainerDemo() {
  return (
    <ScalesContainer
      orientation="diagonal"
      size={8}
      containerClassName="h-96 w-full overflow-hidden rounded-lg bg-white  dark:bg-black shadow-sm shadow-black/10 dark:shadow-white/10 ring-1 ring-black/5 flex items-center justify-center flex-col"
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Scales Container
        </h2>
        <p className="max-w-md text-center text-neutral-600 dark:text-neutral-400">
          Wrap your content with the ScalesContainer component for a clean API.
        </p>
      </div>
    </ScalesContainer>
  );
}
