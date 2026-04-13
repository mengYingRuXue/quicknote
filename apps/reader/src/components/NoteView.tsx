import { MarkdownRenderer, Card, CardContent } from "@quicknote/ui";
import { formatDate } from "@quicknote/shared";
import type { Note } from "@quicknote/types";

export function NoteView({ note }: { note: Note }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <h1 className="mb-4 text-3xl font-bold">{note.title}</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            创建于 {formatDate(note.created_at)}
          </p>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <MarkdownRenderer content={note.content} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
