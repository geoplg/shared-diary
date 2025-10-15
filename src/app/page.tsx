"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type Entry = {
  id: string;
  title: string;
  start_date: string;
  end_date?: string; 
  category: string;
  photos?: string[];
};

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle");
  const [message, setMessage] = useState<string>("");

  const [entriesByCategory, setEntriesByCategory] = useState<Record<string, Entry[]>>({
    Travel: [],
    Food: [],
    Activities: [],
  });

  const [open, setOpen] = useState<Record<string, boolean>>({
    Travel: true,
    Food: false,
    Activities: false,
  });
  const [activeCategory, setActiveCategory] = useState("Travel");

  const fetchEntries = async () => {
    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase
      .from("entries")
      .select("id, title, start_date, end_date, category, photos")
      .order("start_date", { ascending: false });

    if (error) {
      console.error(error);
      setStatus("error");
      setMessage("Failed to fetch entries.");
      return;
    }

    const grouped: Record<string, Entry[]> = { Travel: [], Food: [], Activities: [] };
    data.forEach((entry) => grouped[entry.category]?.push(entry));

    setEntriesByCategory(grouped);
    setStatus("success");
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggle = (category: string) => {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setStatus("loading");
    setMessage("");

    const { error } = await supabase.from("entries").delete().eq("id", id);

    if (error) {
      setStatus("error");
      setMessage("Failed to delete entry: " + error.message);
      return;
    }

    const updated = { ...entriesByCategory };
    Object.keys(updated).forEach((cat) => {
      updated[cat] = updated[cat].filter((e) => e.id !== id);
    });
    setEntriesByCategory(updated);

    setStatus("success");
    setMessage("Entry deleted successfully!");
  };

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <>
      <header className="relative w-full h-[400px] flex items-end overflow-hidden">
        <div className="color-peach absolute inset-0 w-1/3 left-0"></div>

        <div
          className="absolute inset-0 left-1/3 w-2/3 bg-cover bg-center"
          style={{ backgroundImage: "url('/img1.jpg')" }}
        ></div>

        <div className="relative z-10 text-left px-8 py-5">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-brown text-5xl md:text-6xl lg:text-7xl font-bold drop-shadow-md mb-3 lg:mb-5"
          >
            GirlGangGoals
          </motion.h1>

          <motion.p
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="text-green text-1xl md:text-2xl lg:text-3xl font-bold bg-purple-50 px-2 py-1 rounded inline-block rounded-lg"
          >
            Made by Georgia Palaiologou
          </motion.p>
        </div>
      </header>

<div className="relative w-full flex flex-col md:flex-row items-center overflow-hidden mb-8 h-auto md:h-[400px]">
  <div className="absolute inset-0 color-green"></div>

  <motion.div
    initial={{ x: -80, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    transition={{ duration: 1, ease: "easeOut" }}
    viewport={{ once: true }}
    className="relative w-full md:w-2/5 flex justify-center items-center"
  >
    <img
      src="/img8.jpg"
      alt="About Us"
      className="relative w-[300px] h-[300px] object-cover rounded-lg shadow-lg mt-6 md:mt-0"
    />
  </motion.div>

  <motion.div
    initial={{ x: 80, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    transition={{ duration: 1, ease: "easeOut" }}
    viewport={{ once: true }}
    className="w-full md:w-3/5 p-6 flex flex-col justify-center z-10 text-center md:text-left"
  >
    <h2 className="text-brown text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
      About Us
    </h2>
    <p className="text-brown text-1xl md:text-2xl">
      We are a group of "asta na pane" sisters who decided to become the guinea pigs of the oldest... Enjoy ^^
    </p>
  </motion.div>
</div>


      <div className="max-w-4xl mx-auto my-8 py-8">
        <div className="min-h-[auto]">
          <div className="text-center mb-6">
            <h1 className="text-green text-3xl md:text-4xl lg:text-5xl font-bold">Our Shared Diary</h1>
            {status !== "idle" && (
              <p className={`text-sm mt-2 ${status === "error" ? "text-red-500" : "text-green-500"}`}>{message}</p>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {Object.keys(entriesByCategory).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-1 rounded-full text-1xl font-medium transition-colors ${
                  activeCategory === category
                    ? "color-green text-white"
                    : "bg-white text-green border border-green hover:bg-green hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {status === "loading" ? (
            <p className="text-gray-500 text-center mb-4">Loading entries...</p>
          ) : entriesByCategory[activeCategory]?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {entriesByCategory[activeCategory].map((entry) => (
                <Link
                  href={`/entry/${entry.id}`}
                  key={entry.id}
                  className="block bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {entry.photos && entry.photos.length > 0 ? (
                    <img
                      src={entry.photos[0]}
                      alt={entry.title}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-40 color-peach text-green rounded-lg flex items-center justify-center mb-3">
                      No photo
                    </div>
                  )}

                  <h3 className="text-2xl font-semibold text-green">
                    {entry.title}
                  </h3>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(entry.id);
                    }}
                    disabled={status === "idle"} 
                    className={`mt-2 text-sm font-medium ${
                      status === "idle"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-brown hover:text-red-700"
                    }`}
                  >
                    Delete
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-brown text-center">No entries in this category yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
