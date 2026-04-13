"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea } from "@quicknote/ui";

export default function NewNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: title || "无标题",
        content,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      setSaving(false);
      return;
    }

    router.push(`/notes/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">新建笔记</h1>
      <form onSubmit={handleCreate} className="space-y-4">
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
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "创建笔记"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
