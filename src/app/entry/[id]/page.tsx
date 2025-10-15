"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Calendar from "react-calendar";
import "@/styles/calendar.css";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type Entry = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  category: string;
  content: string;
  photos?: string[];
};

function parseISODateToLocalDateOnly(iso?: string | null) {
  if (!iso) return null;
  const parts = iso.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export default function EntryDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("Travel");
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);

  const [editPhotos, setEditPhotos] = useState<string[]>([]);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchEntry = async () => {
      setStatus("loading");
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching entry:", error);
        setMessage("Failed to load entry.");
        setStatus("error");
      } else if (data) {
        setEntry(data);
        setTitle(data.title);
        setStartDate(data.start_date ?? "");
        setEndDate(data.end_date ?? "");
        setCategory(data.category);
        setContent(data.content);
        setStatus("success");
      }
    };

    fetchEntry();
  }, [id]);

  const startEditing = () => {
    if (!entry) return;
    setEditPhotos(entry.photos || []);
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setStatus("loading");
    setMessage("Updating entry...");

    const safeEndDate = endDate ? endDate : null;
    let photoUrls: string[] = [...editPhotos];

    if (photos) {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) continue;

        const fileName = `${entry.id}_${Date.now()}_${file.name}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from("entry-photos")
            .upload(fileName, file, { cacheControl: "3600", upsert: true });

          if (uploadError) continue;

          const { data: publicData } = supabase.storage
            .from("entry-photos")
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) photoUrls.push(publicData.publicUrl);
        } catch (err) {
          console.error(err);
        }
      }
    }

    const { error: updateError } = await supabase
      .from("entries")
      .update({
        title,
        start_date: startDate,
        end_date: safeEndDate,
        category,
        content,
        photos: photoUrls,
      })
      .eq("id", entry.id);

    if (updateError) {
      setMessage("Failed to update entry: " + updateError.message);
      setStatus("error");
    } else {
      setEntry({
        ...entry,
        title,
        start_date: startDate,
        end_date: safeEndDate,
        category,
        content,
        photos: photoUrls,
      });
      setIsEditing(false);
      setPhotos(null);
      setMessage("Entry updated successfully!");
      setStatus("success");

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, message]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
  }, [isEditing]);

  const handleTempDeletePhoto = (url: string) => {
    setEditPhotos((prev) => prev.filter((p) => p !== url));
  };

  if (!entry) return <div className="p-4">Loading...</div>;

  const start = parseISODateToLocalDateOnly(entry.start_date);
  const end = entry.end_date ? parseISODateToLocalDateOnly(entry.end_date) : start;

  const calendarValue = entry.end_date ? [start, end] : start;

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month" || !start) return "";
    
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const s = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    const e = end ? new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())) : s;

    if (d.getTime() >= s.getTime() && d.getTime() <= e.getTime()) {
      return "highlighted-day";
    }
    return "";
  };

  return (
    <div className="below-navbar min-h-screen px-6 mb-6 flex flex-col md:flex-row gap-6">
      <div className="flex-[6] flex flex-col gap-4">
        {message && (
          <div className={`py-2 text-sm ${status === "error" ? "text-red-500" : "text-green-500"}`}>
            {message}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 m-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-green rounded-lg p-2 text-brown focus:border-green focus:ring-1 focus:ring-green outline-none"
              required
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 border-2 border-green rounded-lg p-2 text-brown focus:border-green focus:ring-1 focus:ring-green outline-none"
                required
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 border-2 border-green rounded-lg p-2 text-brown focus:border-green focus:ring-1 focus:ring-green outline-none"
              />
            </div>

            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="border-2 border-green rounded-lg p-2 text-brown focus:border-green focus:ring-1 focus:ring-green outline-none" > 
              <option value="Travel">Travel</option> 
              <option value="Food">Food</option> 
              <option value="Activities">Activities</option> 
            </select> 

            <ReactQuill
              value={content}
              onChange={setContent}
              className="border-2 border-green rounded-lg text-brown focus:border-green focus:ring-1 focus:ring-green outline-none"
              theme="snow"
            />

            <div>
              <label className="cursor-pointer color-green hover:bg-green text-white px-5 py-2 rounded-lg transition-colors inline-block">
                Choose Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotos(e.target.files)}
                  className="hidden"
                />
              </label>

              {(photos && photos.length > 0) && (
                <div className="text-sm text-green mt-2">
                  {Array.from(photos).map((f) => f.name).join(", ")}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="color-green text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-green transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditPhotos(entry.photos || []);
                  setTitle(entry.title);
                  setStartDate(entry.start_date ?? "");
                  setEndDate(entry.end_date ?? "");
                  setCategory(entry.category);
                  setContent(entry.content);

                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="color-peach text-brown px-4 py-2 rounded-lg hover:bg-brown transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-5xl font-bold text-green">{entry.title}</h1>

            <div className="w-full">
              <Calendar
                value={calendarValue as any}
                selectRange={!!entry.end_date}
                tileClassName={tileClassName}
                onClickDay={() => null}
              />
            </div>

            <div
              className="border-2 border-green rounded-lg p-4 text-brown prose max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content }}
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

      <div className="color-peach flex-[2] flex flex-col items-center gap-3 p-6 rounded-xl self-start">
        {((isEditing ? editPhotos : entry.photos) || []).length > 0 ? (
          (isEditing ? editPhotos : entry.photos)?.map((url, i) => (
            <div key={i} className="relative w-full flex justify-center transition-opacity duration-300">
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-auto h-100 rounded-lg object-cover shadow-md"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleTempDeletePhoto(url)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-red-600 transition"
                  title="Remove (temp)"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-brown font-medium">No photos</p>
        )}
      </div>
    </div>
  );
}
