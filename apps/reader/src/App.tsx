import { useEffect, useState } from "react";
import { createSupabaseClient } from "@quicknote/shared";
import type { Note } from "@quicknote/types";
import { NoteView } from "./components/NoteView";
import { NotFound } from "./components/NotFound";
import { Loading } from "./components/Loading";

export default function App() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNote() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("note");

      if (!slug) {
        setError("缺少笔记参数");
        setLoading(false);
        return;
      }

      const supabase = createSupabaseClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get share link
      const { data: shareLink } = await supabase
        .from("share_links")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!shareLink) {
        setError("笔记不存在或已被删除");
        setLoading(false);
        return;
      }

      // Check expiration
      if (shareLink.expires_at) {
        const expiresAt = new Date(shareLink.expires_at);
        if (expiresAt < new Date()) {
          setError("分享链接已过期");
          setLoading(false);
          return;
        }
      }

      // Get note
      const { data: noteData } = await supabase
        .from("notes")
        .select("*")
        .eq("id", shareLink.note_id)
        .eq("is_public", true)
        .single();

      if (!noteData) {
        setError("笔记不存在或未公开");
        setLoading(false);
        return;
      }

      setNote(noteData);
      setLoading(false);
    }

    fetchNote();
  }, []);

  if (loading) return <Loading />;
  if (error) return <NotFound message={error} />;
  if (!note) return <NotFound message="笔记不存在" />;

  return <NoteView note={note} />;
}
