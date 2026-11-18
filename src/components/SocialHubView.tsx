import React, { useState } from "react";
import {
  Share2,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Send,
  Sparkles,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  BarChart2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { SocialPlatform } from "../types";

export const SocialHubView: React.FC = () => {
  const {
    socialAccounts,
    socialFeed,
    socialDigest,
    generateSocialDigest,
    isGeneratingDigest,
    toggleConnectAccount,
    addNotification,
    tr,
  } = useApp();

  const [postText, setPostText] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<SocialPlatform[]>(["LinkedIn", "Twitter"]);
  const [scheduledPosts, setScheduledPosts] = useState<{ id: string; text: string; platforms: string[]; time: string }[]>([
    {
      id: "sp-1",
      text: "How we implemented zero-knowledge AES-256 encryption in our real-time AI workspace agent! #AI #Security",
      platforms: ["LinkedIn", "Twitter"],
      time: "Tomorrow at 09:00 AM",
    },
  ]);

  const handleToggleTargetPlatform = (p: SocialPlatform) => {
    if (targetPlatforms.includes(p)) {
      setTargetPlatforms(targetPlatforms.filter((item) => item !== p));
    } else {
      setTargetPlatforms([...targetPlatforms, p]);
    }
  };

  const handleSchedulePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    setScheduledPosts([
      {
        id: "sp-" + Date.now(),
        text: postText.trim(),
        platforms: targetPlatforms,
        time: "Tomorrow at 10:00 AM",
      },
      ...scheduledPosts,
    ]);

    setPostText("");
    addNotification({
      title: "Post Scheduled",
      message: `Scheduled across ${targetPlatforms.join(", ")}!`,
      type: "social",
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-sky-500" />
            Social Media Accounts Hub & Personalized AI Updates
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated feeds across LinkedIn, Twitter/X, GitHub, and YouTube with AI update digests.
          </p>
        </div>

        <button
          onClick={generateSocialDigest}
          disabled={isGeneratingDigest}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          {isGeneratingDigest ? "Generating Digest..." : "Generate AI Social Update Digest"}
        </button>
      </div>

      {/* Connected Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {socialAccounts.map((acc) => (
          <div
            key={acc.id}
            className={`p-5 rounded-2xl border transition-all ${
              acc.isConnected
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={acc.avatar}
                  alt={acc.username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{acc.platform}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{acc.handle}</p>
                </div>
              </div>
              <button
                onClick={() => toggleConnectAccount(acc.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                  acc.isConnected
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {acc.isConnected ? "Connected" : "Connect"}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Followers</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">{acc.followersCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Engagement</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{acc.engagementRate}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Social Digest Card */}
      {socialDigest && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 border border-sky-800/60 text-slate-100 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-800/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300" /> {socialDigest.digestTitle}
            </h3>
            <span className="text-[10px] font-mono text-sky-300 bg-sky-900/60 px-2.5 py-1 rounded-full border border-sky-700">
              {socialDigest.generatedAt}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <p className="font-bold text-cyan-400 uppercase text-[10px]">Highlights Across Networks</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {socialDigest.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <p className="font-bold text-sky-400 uppercase text-[10px]">AI Suggested Post Drafts</p>
              {socialDigest.recommendedPosts.map((post, i) => (
                <div key={i} className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-200">
                  "{post}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Post Composer & Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Composer */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-500" /> Schedule Cross-Post
          </h3>

          <form onSubmit={handleSchedulePost} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Target Networks</label>
              <div className="flex gap-2 flex-wrap">
                {(["LinkedIn", "Twitter", "GitHub", "YouTube"] as SocialPlatform[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => handleToggleTargetPlatform(p)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors ${
                      targetPlatforms.includes(p)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Post Content</label>
              <textarea
                rows={4}
                required
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Write your cross-platform post or let AI suggest a topic..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              + Schedule Across Accounts
            </button>
          </form>

          {/* Scheduled Posts List */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Scheduled Posts</p>
            {scheduledPosts.map((sp) => (
              <div
                key={sp.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>{sp.platforms.join(" • ")}</span>
                  <span>{sp.time}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{sp.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Multi-Platform Feed */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-500" /> Aggregated Live Mentions & Updates
          </h3>

          <div className="space-y-3">
            {socialFeed.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.author}</span>
                    <span className="text-[11px] text-slate-400">{item.handle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                      {item.platform}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.text}</p>

                {item.actionNeeded && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong className="font-bold">AI Action Item:</strong> {item.actionNeeded}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {item.comments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
