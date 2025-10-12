

type FormData = {
  full_name: string;
  bio: string;
  location: string;
  company: string;
  title: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  skills: string[];
  interests: string[];
  looking_for: string[];
};




import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Globe, Plus, X, Save } from "lucide-react";

export default function EditProfileModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState<FormData>(
    {
      full_name: "",
      bio: "",
      location: "",
      company: "",
      title: "",
      github_url: "",
      linkedin_url: "",
      portfolio_url: "",
      skills: [],
      interests: [],
      looking_for: [],

    }
  );
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLookingFor, setNewLookingFor] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        company: user.company || "",
        title: user.title || "",
        github_url: user.github_url || "",
        linkedin_url: user.linkedin_url || "",
        portfolio_url: user.portfolio_url || "",
        skills: user.skills || [],
        interests: user.interests || [],
        looking_for: user.looking_for || []
      });
    }
  }, [user, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field, value, setter) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    setter("");
  };

  const handleArrayRemove = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
           <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Senior Developer, Designer, etc." />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="San Francisco, CA" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Tell us about yourself..." className="min-h-[100px]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => handleArrayRemove('skills', index)} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill..." onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('skills', newSkill, setNewSkill)} />
                  <Button onClick={() => handleArrayAdd('skills', newSkill, setNewSkill)}><Plus className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Interests</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.interests?.map((interest, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {interest}
                      <button onClick={() => handleArrayRemove('interests', index)} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Add an interest..." onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('interests', newInterest, setNewInterest)} />
                  <Button onClick={() => handleArrayAdd('interests', newInterest, setNewInterest)}><Plus className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Looking For</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.looking_for?.map((item, index) => (
                    <Badge key={index} variant="default" className="flex items-center gap-1 bg-emerald-100 text-emerald-800">
                      {item}
                      <button onClick={() => handleArrayRemove('looking_for', index)} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newLookingFor} onChange={(e) => setNewLookingFor(e.target.value)} placeholder="e.g., Collaborators, Mentorship..." onKeyPress={(e) => e.key === 'Enter' && handleArrayAdd('looking_for', newLookingFor, setNewLookingFor)} />
                  <Button onClick={() => handleArrayAdd('looking_for', newLookingFor, setNewLookingFor)}><Plus className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-slate-600" />
                  <Input value={formData.github_url} onChange={(e) => handleInputChange('github_url', e.target.value)} placeholder="https://github.com/username" />
                </div>
                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-slate-600" />
                  <Input value={formData.linkedin_url} onChange={(e) => handleInputChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-600" />
                  <Input value={formData.portfolio_url} onChange={(e) => handleInputChange('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" />
                </div>
              </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}