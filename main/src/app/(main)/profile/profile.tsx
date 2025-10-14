"use client"
import React, { useState, useEffect, useCallback } from "react";
import { User } from "../../(components)/entities/User";
import Project from "../../(components)/entities/Project.json";

import PeerPoint  from "../../(components)/entities/PeerPoint.json";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User as UserIcon, Building, MapPin, Link as LinkIcon, Github, Linkedin, Sparkles, FolderOpen, MessageSquare, Award, GitBranch, Calendar as CalendarIcon, Star, Pencil } from "lucide-react";
import { motion } from "framer-motion";

import CalendarTab from "../../(components)/profile/CalenderTab";
import ProjectCard from "../../(components)/dashboard/ProjectCard";
import EditProfileModal from "../../(components)/profile/EditProfileModal";


type stats = {
  solvedPeerPoints: number;
  //averageRating: number | string

}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ projects: [], peerPoints: [] });
  const [stats, setStats] = useState<stats>({ solvedPeerPoints: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const projectsData = Project.map(project => {project.team_members})
      const peerPointsData = PeerPoint.map(peerpoint => ({
        requester: peerpoint.requester,
        reviewer: peerpoint.reviewer,
        status: peerpoint.status
      }));
      
      setData({ projects: projectsData, peerPoints: peerPointsData });

      const completedPeerPoints = peerPointsData.filter(
        r => r.reviewer === currentUser.email && r.status === 'completed' 
      );
      //const totalRating = completedPeerPoints.reduce((sum, r) => sum + r.rating, 0);
      //const averageRating = completedPeerPoints.length > 0 ? (totalRating / completedPeerPoints.length).toFixed(1) : 0;
      setStats({
        solvedPeerPoints: completedPeerPoints.length,
        //averageRating: averageRating
      });

    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSaveProfile = async (updatedData) => {
    try {
      await User.updateMyUserData(updatedData);
      await fetchUserData(); // Refetch all data to ensure consistency
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Could not load profile.</h2>
        <p className="text-slate-600">Are you logged in?</p>
      </div>
    );
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const mockBadges = [
    { name: "Pioneer", icon: Award, description: "Joined in the first month" },
    { name: "Collaborator", icon: FolderOpen, description: "Contributed to 5+ projects" },
    { name: "Top Reviewer", icon: MessageSquare, description: "Completed 10+ PeerPoints" },
    { name: "Open Source Star", icon: Github, description: "Contributed to a major OS project" },
  ];

  return (
    <>
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-slate-100">
                  {getInitials(user.full_name)}
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <h1 className="text-3xl font-bold text-slate-900">{user.full_name}</h1>
                  <Button variant="outline" size="icon" onClick={() => setIsEditModalOpen(true)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-md text-slate-600">{user.title}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Projects</p>
                  <p className="text-xl font-bold text-emerald-600">{data.projects.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">PeerPoints</p>
                  <p className="text-xl font-bold text-teal-600">{data.peerPoints.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Reputation</p>
                  <p className="text-xl font-bold text-blue-600">1,250</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
              <Card className="shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">About</h3>
                  <p className="text-sm text-slate-600">{user.bio}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-500"><MapPin className="w-4 h-4"/>{user.location}</div>
                    <div className="flex items-center gap-2 text-slate-500"><Building className="w-4 h-4"/>{user.company}</div>
                  </div>
                </div>
              </Card>
              <Card className="shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">PeerPoints Solved</span>
                      <span className="font-bold text-emerald-600">{stats.solvedPeerPoints}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Average Rating</span>
                      <div className="flex items-center gap-1 font-bold text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        { /*<span>{stats.averageRating}</span> */}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills?.map(skill => <div key={skill} className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">{skill}</div>)}
                  </div>
                </div>
              </Card>
              <Card className="shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Links</h3>
                  <div className="space-y-2">
                     <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"><Github className="w-4 h-4" /> GitHub</a>
                     <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"><Linkedin className="w-4 h-4" /> LinkedIn</a>
                     <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"><LinkIcon className="w-4 h-4" /> Portfolio</a>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
               <Tabs defaultValue="projects" className="w-full">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm mb-6">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="peerpoints">PeerPoints</TabsTrigger>
                  <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-2"/>My Calendar</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>
                
                <TabsContent value="projects">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.projects.map(project => <ProjectCard key={project.id} project={project} onViewMore={() => {}} onContribute={() => {}} />)}
                  </div>
                   {data.projects.length === 0 && <p className="text-slate-500 text-center py-10">No projects to display.</p>}
                </TabsContent>

                <TabsContent value="peerpoints">
                  <div className="space-y-4">
                    {data.peerPoints.map(pp => (
                       <Card key={pp.id} className="bg-white p-4">
                         <h4 className="font-semibold">{pp.title}</h4>
                         <p className="text-sm text-slate-600">{pp.description}</p>
                       </Card>
                     ))}
                  </div>
                   {data.peerPoints.length === 0 && <p className="text-slate-500 text-center py-10">No PeerPoints to display.</p>}
                </TabsContent>
                
                <TabsContent value="calendar">
                  <CalendarTab user={user} />
                </TabsContent>

                <TabsContent value="badges">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mockBadges.map(badge => (
                      <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                          <badge.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">{badge.name}</h4>
                        <p className="text-xs text-slate-500">{badge.description}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </>
  );
}
