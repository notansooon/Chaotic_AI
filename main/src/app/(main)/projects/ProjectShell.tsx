"use client";
import React, { useState, useEffect, useCallback, use } from "react";
import Project from "../../(components)/entities/Project.json"



import { InvokeLLM } from "../../(components)/integration/core"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ExternalLink, Users, Star, GitBranch, Github, Globe } from "lucide-react";
import { motion } from "framer-motion";

import ProjectCard from "../../(components)/dashboard/ProjectCard";
import CategoryDropdown from "../../(components)/ui/CategoryDropdown"; 
import ProjectDetailModal from "../(components)/dashboard/ProjectDetailModal";

export default function Projects() {
  const [collaborationProjects, setCollaborationProjects] = useState([]);
  const [openSourceProjects, setOpenSourceProjects] = useState([]);
  const [filteredCollabProjects, setFilteredCollabProjects] = useState([]);
  const [filteredOpenSourceProjects, setFilteredOpenSourceProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("collaboration");
  const [isLoading, setIsLoading] = useState(true);
  const [osLoading, setOsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const generateOpenSourceProjects = useCallback(async () => {
    setOsLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `Find and generate 12 real trending open source projects currently popular on GitHub and other platforms. 
        Include diverse categories like AI/ML, web development, mobile, DevOps, security, etc.
        For each project provide: name, description, programming language, GitHub stars (realistic numbers), 
        main contributors, GitHub URL, and current status.`,
        //add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  language: { type: "string" },
                  stars: { type: "number" },
                  contributors: { type: "array", items: { type: "string" } },
                  github_url: { type: "string" },
                  homepage_url: { type: "string" },
                  category: { type: "string" },
                  status: { type: "string" },
                  last_updated: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setOpenSourceProjects(result.projects || []);
    } catch (error) {
      console.error("Error generating open source projects:", error);
    }
    setOsLoading(false);
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const collabData = await Project.map(projcet => projcet.collaboration === true);
      setCollaborationProjects(collabData);
      
      // Load open source projects
      await generateOpenSourceProjects();
    } catch (error) {
      console.error("Error loading projects:", error);
    }
    setIsLoading(false);
  }, [generateOpenSourceProjects]);

  const filterProjects = useCallback(() => {
    // Filter collaboration projects
    let filteredCollab = collaborationProjects;
    if (searchTerm) {
      filteredCollab = filteredCollab.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedCategory !== "all") {
      filteredCollab = filteredCollab.filter(project =>
        project.tags?.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    }
    setFilteredCollabProjects(filteredCollab);

    // Filter open source projects
    let filteredOS = openSourceProjects;
    if (searchTerm) {
      filteredOS = filteredOS.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.language.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filteredOS = filteredOS.filter(project =>
        project.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    setFilteredOpenSourceProjects(filteredOS);
  }, [collaborationProjects, openSourceProjects, searchTerm, selectedCategory]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]); // Added loadProjects to dependencies

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const handleViewMore = (project) => {
    setSelectedProject(project);
  };

  const handleContribute = (project) => {
    console.log("Contributing to project:", project.title || project.name);
  };

  const OpenSourceProjectCard = ({ project }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full bg-white/70 backdrop-blur-sm border-slate-200/60 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-600" />
                {project.name}
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">{project.description}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>{project.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{project.stars?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                {project.category}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                Open Source
              </Badge>
            </div>

            {project.contributors && project.contributors.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-medium">Contributors:</span> {project.contributors.slice(0, 2).join(', ')}
                {project.contributors.length > 2 && ` +${project.contributors.length - 2} more`}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => window.open(project.github_url, '_blank')}
              >
                <Github className="w-3 h-3 mr-1" />
                View Code
              </Button>
              {project.homepage_url && (
                <Button 
                  size="sm"
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(project.homepage_url, '_blank')}
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Live Demo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-3"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Projects</h1>
        <p className="text-slate-600">
          Explore trending open source projects and find collaboration opportunities.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search projects, technologies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-slate-200"
            />
          </div>
          
          <CategoryDropdown 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        </div>
      </motion.div>

      {/* Project Tabs */}
      <Tabs defaultValue="collaboration" value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-8 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaboration Projects
            </TabsTrigger>
            <TabsTrigger value="opensource" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              Open Source
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="collaboration" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Looking for Collaborators</h2>
              <span className="text-sm text-slate-500">{filteredCollabProjects.length} projects</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollabProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewMore={handleViewMore}
                  onContribute={handleContribute}
                />
              ))}
            </div>

            {filteredCollabProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No collaboration projects found</h3>
                <p className="text-slate-600">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="opensource" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Trending Open Source</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{filteredOpenSourceProjects.length} projects</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateOpenSourceProjects}
                  disabled={osLoading}
                  className="text-xs"
                >
                  {osLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
            
            {osLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/70 backdrop-blur-sm rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded mb-3"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpenSourceProjects.map((project, index) => (
                  <OpenSourceProjectCard key={index} project={project} />
                ))}
              </div>
            )}

            {!osLoading && filteredOpenSourceProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Github className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No open source projects found</h3>
                <p className="text-slate-600">Try adjusting your search criteria or refresh to load new projects.</p>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}