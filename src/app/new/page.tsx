"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function NewEntryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("Travel");
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate) {
      setMessage("Title and start date are required.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("Uploading entry...");

    let photoUrls: string[] = [];

    if (photos) {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileName = `${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("entry-photos")
          .upload(fileName, file, { cacheControl: "3600", upsert: true });

        if (uploadError) continue;

        const { data: publicData } = supabase.storage
          .from("entry-photos")
          .getPublicUrl(fileName);

        if (publicData?.publicUrl) photoUrls.push(publicData.publicUrl);
      }
    }

    const { data, error } = await supabase
      .from("entries")
      .insert([
        {
          title,
          start_date: startDate,
          end_date: endDate || null,
          category,
          content,
          photos: photoUrls,
        },
      ])
      .select("id")
      .single();

    if (error) {
      setMessage("Failed to add entry: " + error.message);
      setStatus("error");
    } else if (data?.id) {
      setMessage("Entry added successfully!");
      setStatus("success");
      router.push(`/entry/${data.id}`);
    }
  };

  return (
    <div className="below-navbar min-h-screen flex flex-col items-center m-2">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 border-2 border-green">
        <h1 className="text-brown text-4xl font-bold mb-6 text-center">
          New Entry
        </h1>

        {status !== "idle" && (
          <div
            className={`text-center p-2 mb-4 rounded-lg text-sm font-medium ${
              status === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Entry Title"
            className="text-brown border-2 border-green rounded-lg p-3 placeholder:text-green focus:border-green focus:ring-1 focus:ring-green outline-none transition"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-brown flex-1 border-2 border-green rounded-lg p-3 focus:border-green focus:ring-1 focus:ring-green outline-none"
              required
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-brown flex-1 border-2 border-green rounded-lg p-3 focus:border-green focus:ring-1 focus:ring-green outline-none"
              placeholder="Optional"
            />
          </div>

          <select
            className="text-brown border-2 border-green rounded-lg p-3 focus:border-green focus:ring-1 focus:ring-green outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Travel">Travel</option>
            <option value="Food">Food</option>
            <option value="Activities">Activities</option>
          </select>

          <ReactQuill
            value={content}
            onChange={setContent}
            theme="snow"
            className="border-2 border-green rounded-lg text-brown focus:border-green focus:ring-1 focus:ring-green outline-none"
            style={{
              minHeight: "180px",
              background: "transparent",
              color: "#d4a373",
            }}
          />

          <div>
            <label className="cursor-pointer color-green hover:bg-green text-white px-5 py-2 rounded-lg transition-colors inline-block">
              Choose Photos
              <input
                type="file"
                multiple
                onChange={(e) => setPhotos(e.target.files)}
                className="hidden"
              />
            </label>
            {photos && photos.length > 0 && (
              <div className="text-sm text-green mt-2">
                {Array.from(photos).map((f) => f.name).join(", ")}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="color-green text-white font-bold px-6 py-3 rounded-lg hover:bg-green disabled:opacity-50 transition-colors self-center mt-2"
          >
            Save Entry
          </button>
        </form>
      </div>
    </div>
  );
}