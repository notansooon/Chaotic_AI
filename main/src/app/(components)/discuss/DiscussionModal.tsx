import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, User, Clock, Code2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentsJson from "../entities/Comment.json";
type DiscussionComment = {
  id: string;
  discussionId: string;
  author: string;
  content: string;
  created_date: string;
  upvotes?: number;
};

export default function DiscussionModal({ discussion, isOpen, onClose, onVote, currentUser, onDiscussionUpdated }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const refreshComments = useCallback(async () => {
    if (!discussion) return;
    setIsLoadingComments(true);
    try {
      const commentsData: DiscussionComment[] = CommentsJson.filter(
        (c: DiscussionComment) => c.discussionId === discussion.id
      );
      setComments(commentsData.sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()));
      onDiscussionUpdated({...discussion, replies: commentsData.length});
    } catch (error) {
      console.error("Error fetching comments", error);
    }
    setIsLoadingComments(false);
  }, [discussion, onDiscussionUpdated]);

  useEffect(() => {
    if (isOpen) {
      refreshComments();
    }
  }, [isOpen, refreshComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || !discussion) return;
    setIsSubmitting(true);
    /*
    await Comment.create({
      discussion_id: discussion.id,
      content: newComment,
      author: currentUser.email,
    });
    */
    setNewComment("");
    await refreshComments();
    setIsSubmitting(false);
  };
  
  const handleCommentVote = async (commentId, voteType) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const newVotes = (comment.upvotes || 0) + (voteType === 'up' ? 1 : -1);
    //await Comment.update(commentId, { upvotes: Math.max(0, newVotes) });
    await refreshComments();
  };

  if (!discussion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center space-y-1 text-slate-600">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onVote(discussion.id, 'up')}><ChevronUp className="w-5 h-5" /></Button>
              <span className="font-bold text-lg">{discussion.upvotes || 0}</span>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">{discussion.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{discussion.author}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatDistanceToNow(new Date(discussion.created_date))} ago</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {discussion.tags && <div className="flex flex-wrap gap-2">{discussion.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>}
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{discussion.content}</p>
          {discussion.code && (
            <Card className="bg-slate-900 text-white">
              <CardContent className="p-4">
                <pre className="font-mono text-sm overflow-x-auto"><code>{discussion.code}</code></pre>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6 border-t pt-6">
            <h3 className="font-semibold text-lg">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
            
            {currentUser && (
              <div className="flex gap-3">
                <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" />
                <Button onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}><Send className="w-4 h-4" /></Button>
              </div>
            )}

            <div className="space-y-4">
              {isLoadingComments ? <p>Loading comments...</p> : comments.map(comment => (
                <div key={comment.id} className="flex gap-3 pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
                  <div className="flex flex-col items-center space-y-1 text-slate-600 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCommentVote(comment.id, 'up')}><ChevronUp className="w-4 h-4" /></Button>
                    <span className="font-medium text-xs">{comment.upvotes || 0}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-slate-800">{comment.author}</span>
                      <span className="text-xs text-slate-500">• {formatDistanceToNow(new Date(comment.created_date))} ago</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}