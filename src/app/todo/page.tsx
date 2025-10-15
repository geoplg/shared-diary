"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function TodoPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [todoId, setTodoId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTodo = async () => {
      setStatus("loading");
      const { data, error } = await supabase.from("todo").select("*").limit(1).single();

      if (error && error.code !== "PGRST116") {
        console.error(error);
        setStatus("error");
        setMessage("Failed to load To-Do.");
      } else if (data) {
        setTodoId(data.id);
        setTitle(data.title || "");
        setContent(data.content || "");
        setStatus("idle");
      } else {
        const { data: newTodo, error: insertError } = await supabase
          .from("todo")
          .insert([{ title: "My To-Do List", category: "Personal", content: "" }])
          .select()
          .single();
        if (!insertError && newTodo) {
          setTodoId(newTodo.id);
          setTitle(newTodo.title);
          setContent(newTodo.content);
        }
        setStatus("idle");
      }
    };

    fetchTodo();
  }, []);

  const startEditing = () => {
    setOriginalTitle(title);
    setOriginalContent(content);
    setIsEditing(true);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const cancelEditing = () => {
    setTitle(originalTitle);
    setContent(originalContent);
    setIsEditing(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!todoId) return;

    setStatus("loading");
    setMessage("Saving...");

    const { error } = await supabase
      .from("todo")
      .update({ title, content })
      .eq("id", todoId);

    if (error) {
      console.error(error);
      setStatus("error");
      setMessage("Failed to save.");
    } else {
      setStatus("success");
      setMessage("Saved!");
      setIsEditing(false);

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 2000);
  };

  return (
    <div className="below-navbar min-h-screen px-6 mb-6 flex flex-col gap-6">
      {message && (
        <div className={`py-2 text-sm ${status === "error" ? "text-red-500" : "text-green-500"}`}>
          {message}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-2 border-green rounded-lg p-2 text-brown focus:ring-green focus:border-green outline-none"
          />

          <ReactQuill
            value={content}
            onChange={setContent}
            theme="snow"
            className="border-2 border-green rounded-lg text-brown"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={status === "loading"}
              className="color-green text-white px-4 py-2 rounded-lg hover:bg-green transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={cancelEditing}
              className="color-peach text-brown px-4 py-2 rounded-lg hover:bg-brown transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-5xl font-bold text-green">{title}</h1>

          <div
            className="border-2 border-green rounded-lg p-4 text-brown prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: content || "<p>No items yet</p>",
            }}
          />

          <button
            onClick={startEditing}
            className="mt-2 color-green text-white font-bold px-4 py-2 rounded-lg hover:bg-green transition-colors"
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}