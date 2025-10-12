import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CreateDiscussionModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    await onCreate({
      title,
      content,
      code,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    
    // Reset form
    setTitle("");
    setContent("");
    setCode("");
    setTags("");
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="What's your question or topic?" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Description</Label>
            <Textarea 
              id="content" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Provide more details about your question or discussion topic..." 
              className="min-h-[120px]" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code (Optional)</Label>
            <Textarea 
              id="code" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="Paste any relevant code here..." 
              className="min-h-[80px] font-mono text-sm" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input 
              id="tags" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
              placeholder="javascript, react, algorithm, etc." 
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}