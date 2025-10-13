
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye, Star, GitBranch, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectCard({ project, onViewMore, onContribute }) {
  return (
    <motion.div
      
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      
    >
      <Card className="h-full bg-white/70 backdrop-blur-sm border-emerald-200/60 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
        {project.image_url && (
          <div className="h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-t-lg relative overflow-hidden">
            <img 
              src={project.image_url} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-semibold text-slate-900 leading-tight">{project.title}</h3>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags?.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {tag}
              </Badge>
            ))}
            {project.tags?.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {project.team_members?.length || 0}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {project.followers?.length || 0}
              </div>
              {project.github_url && (
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  Code
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>4.8</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 text-xs border-emerald-200 hover:bg-emerald-50"
              onClick={() => onViewMore(project)}
            >
              <ChevronRight className="w-3 h-3 mr-1" />
              View More
            </Button>
            <Button 
              size="sm"
              className="flex-1 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => onContribute(project)}
            >
              Contribute
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
