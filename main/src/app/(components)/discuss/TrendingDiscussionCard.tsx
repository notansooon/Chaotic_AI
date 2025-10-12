import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUp, MessageSquare } from "lucide-react";

export default function TrendingDiscussionCard({ discussion }) {
  const getSourceInfo = (source = "") => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes("reddit")) {
      return { name: "Reddit", className: "bg-red-500 text-white" };
    }
    if (lowerSource.includes("hacker news")) {
      return { name: "Hacker News", className: "bg-orange-500 text-white" };
    }
    if (lowerSource.includes("lobste.rs")) {
      return { name: "Lobste.rs", className: "bg-red-700 text-white" };
    }
    return { name: source, className: "bg-slate-200 text-slate-800" };
  };

  const sourceInfo = getSourceInfo(discussion.source);

  return (
    <a
      href={discussion.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className="flex flex-col gap-2">
        <h4 className="font-semibold text-sm text-slate-800 leading-tight group-hover:text-blue-600">
          {discussion.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <Badge variant="secondary" className={sourceInfo.className}>
            {sourceInfo.name}
          </Badge>
          <div className="flex items-center gap-4">
            {discussion.points && (
              <div className="flex items-center gap-1 font-medium text-orange-600">
                <ArrowUp className="w-3 h-3" />
                <span>{discussion.points}</span>
              </div>
            )}
            {discussion.comments && (
              <div className="flex items-center gap-1 font-medium text-blue-600">
                <MessageSquare className="w-3 h-3" />
                <span>{discussion.comments}</span>
              </div>
            )}
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
          </div>
        </div>
      </div>
    </a>
  );
}