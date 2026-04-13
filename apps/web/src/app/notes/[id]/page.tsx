"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  MarkdownRenderer,
} from "@quicknote/ui";
import { generateSlug } from "@quicknote/shared";
import type { Note } from "@quicknote/types";
import { ArrowLeft, Share2, Eye, Edit2, Trash2 } from "lucide-react";

export default function NoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchNote() {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      }
    }
    fetchNote();
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await supabase
      .from("notes")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);
  }, [title, content, id]);

  // Auto-save with debounce
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        handleSave();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content, note, handleSave]);

  async function handleShare() {
    // Mark note as public
    await supabase.from("notes").update({ is_public: true }).eq("id", id);

    // Check if share link already exists
    const { data: existing } = await supabase
      .from("share_links")
      .select("slug")
      .eq("note_id", id)
      .single();

    if (existing) {
      setShareUrl(`${window.location.origin}/reader/?note=${existing.slug}`);
      return;
    }

    const slug = generateSlug();
    await supabase.from("share_links").insert({ note_id: id, slug });
    setShareUrl(`${window.location.origin}/reader/?note=${slug}`);
  }

  async function handleDelete() {
    if (!confirm("确定要删除这篇笔记吗？")) return;
    await supabase.from("notes").delete().eq("id", id);
    router.push("/dashboard");
  }

  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saving ? "保存中..." : "已保存"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview(!preview)}
          >
            {preview ? (
              <Edit2 className="mr-1 h-4 w-4" />
            ) : (
              <Eye className="mr-1 h-4 w-4" />
            )}
            {preview ? "编辑" : "预览"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" />
            分享
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {shareUrl && (
        <Card className="mb-4">
          <CardContent className="flex items-center gap-2 p-4">
            <span className="text-sm">分享链接：</span>
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
              {shareUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              复制
            </Button>
          </CardContent>
        </Card>
      )}

      {preview ? (
        <div className="rounded-lg border p-6">
          <h1 className="mb-4 text-2xl font-bold">{title}</h1>
          <MarkdownRenderer content={content} />
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="笔记标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
          <Textarea
            placeholder="开始写点什么... (支持 Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}
