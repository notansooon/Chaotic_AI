"use client"


import React, { useState, useEffect, useCallback } from "react";
import Discussion  from "../(components)/entities/Discuss.json";
import { User }  from "../(components)/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { InvokeLLM } from "../(components)/integration/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import DiscussionCard from "../(components)/discuss/DIscussionCard";
import CreateDiscussionModal from "../(components)/discuss/CreateDiscussionModal";
import TrendingDiscussionCard from "../(components)/discuss/TrendingDiscussionCard";
import DiscussionModal from "../(components)/discuss/DiscussionModal";

export default function Discuss() {
  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [trendingDiscussions, setTrendingDiscussions] = useState([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  const loadDiscussions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [discussionsData, user] = await Promise.all([
        Discussion.map(discussions => { 
          
         }),
        User.me().catch(() => null)
      ]);
      setDiscussions(Discussion);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading discussions:", error);
    }
    setIsLoading(false);
  }, []);

  const loadTrendingDiscussions = useCallback(async () => {
    setIsTrendingLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `Find 5 top trending programming discussions from developer forums like Reddit's r/programming or Hacker News. Provide title, source, points/upvotes, comment count, and URL.`,
        //add_context_from_internet: true,
        response_json_schema: { type: "object", properties: { discussions: { type: "array", items: { type: "object", properties: { title: { type: "string" }, source: { type: "string" }, points: { type: "string" }, comments: { type: "string" }, url: { type: "string" } } } } } },
      });
      setTrendingDiscussions(result.discussions || []);
    } catch (error) { console.error("Error loading trending discussions:", error); }
    setIsTrendingLoading(false);
  }, []);

  const filterAndSortDiscussions = useCallback(() => {
    let filtered = [...discussions].filter(d => {

    
      console.log(`data: ${d}`)
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    });
    if (sortBy === "popular") filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    else filtered.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()) ;
    setFilteredDiscussions(filtered);
  }, [discussions, searchTerm, sortBy]);
  
  useEffect(() => {
    loadDiscussions();
    loadTrendingDiscussions();
  }, [loadDiscussions, loadTrendingDiscussions]);

  useEffect(() => {
    filterAndSortDiscussions();
  }, [filterAndSortDiscussions]);

  /*
  const handleCreateDiscussion = async (discussionData) => {
    await Discussion.create({ ...discussionData, author: currentUser?.email || 'Anonymous', category: 'general' });
    setShowCreateModal(false);
    loadDiscussions();
  };
  */
  const handleVote = async (discussionId, voteType) => {
    const discussionIndex = discussions.findIndex(d => d.id === discussionId);
    if (discussionIndex === -1) return;

    const discussion = discussions[discussionIndex];
    const newVotes = (discussion.upvotes || 0) + (voteType === 'up' ? 1 : -1);
    //await Discussion.update(discussionId, { upvotes: Math.max(0, newVotes) });
    
    const newDiscussions = [...discussions];
    newDiscussions[discussionIndex].upvotes = Math.max(0, newVotes);
    setDiscussions(newDiscussions);

    if(selectedDiscussion?.id === discussionId){
      setSelectedDiscussion(prev => ({...prev, upvotes: Math.max(0, newVotes)}));
    }
  };

  const onDiscussionUpdated = (updatedDiscussion) => {
      const discussionIndex = discussions.findIndex(d => d.id === updatedDiscussion.id);
      if (discussionIndex === -1) return;
      const newDiscussions = [...discussions];
      newDiscussions[discussionIndex] = updatedDiscussion;
      setDiscussions(newDiscussions);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Discuss</h1>
          <p className="text-slate-600">General programming discussions and questions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={!currentUser}><Plus className="w-4 h-4 mr-2" /> New Discussion</Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search discussions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
            </div>
            <div className="flex gap-2">
              <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}><Clock className="w-4 h-4 mr-1" />Recent</Button>
              <Button variant={sortBy === "popular" ? "default" : "outline"} size="sm" onClick={() => setSortBy("popular")}><TrendingUp className="w-4 h-4 mr-1" />Popular</Button>
            </div>
          </div>

          {isLoading ? <div className="animate-pulse space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>)}</div> : (
            <div className="space-y-3">
              {filteredDiscussions.map(discussion => <DiscussionCard key={discussion.id} discussion={discussion} onVote={handleVote} onSelect={() => setSelectedDiscussion(discussion)} />)}
              {filteredDiscussions.length === 0 && <div className="text-center py-16 text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" /><h3 className="text-lg font-semibold">No discussions yet</h3><p>Be the first to start one!</p></div>}
            </div>
          )}
        </main>
        
        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="w-5 h-5 text-emerald-600" />Trending Online</CardTitle></CardHeader>
            <CardContent>
              {isTrendingLoading ? <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>)}</div> : <div className="space-y-1">{trendingDiscussions.map((item, index) => <TrendingDiscussionCard key={index} discussion={item} />)}</div>}
            </CardContent>
          </Card>
        </aside>
      </div>

     {/* <CreateDiscussionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateDiscussion} /> */}
      <DiscussionModal discussion={selectedDiscussion} isOpen={!!selectedDiscussion} onClose={() => setSelectedDiscussion(null)} onVote={handleVote} currentUser={currentUser} onDiscussionUpdated={onDiscussionUpdated} />
    </div>
  );
}