import * as React from "react";
import type { Note } from "@quicknote/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const preview = note.content.length > 100
    ? note.content.slice(0, 100) + "..."
    : note.content;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{note.title}</CardTitle>
        <CardDescription>
          {new Date(note.updated_at).toLocaleDateString("zh-CN")}
          {note.is_public && (
            <span className="ml-2 text-xs text-green-600">公开</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
      </CardContent>
    </Card>
  );
}
