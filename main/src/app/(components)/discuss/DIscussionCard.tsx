import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, MessageSquare, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DiscussionCard({ discussion, onVote, onSelect }) {
  const handleVote = (e) => {
    e.stopPropagation();
    onVote(discussion.id, 'up');
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center space-y-1 text-slate-600">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVote}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="font-bold text-sm">{discussion.upvotes || 0}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 mb-2 truncate">{discussion.title}</h3>
            <p className="text-slate-600 text-sm line-clamp-2 mb-3">{discussion.content}</p>
            
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {discussion.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {discussion.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{discussion.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-4">
                <span>by {discussion.author}</span>
                <span>{formatDistanceToNow(new Date(discussion.created_date))} ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{discussion.replies || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{discussion.views || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}