import React, { useState, useEffect, useCallback } from "react";
import PeerPoint from "../../(components)/entities/PeerPoint.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, DollarSign, Star } from "lucide-react";
import { motion } from "framer-motion";
import PeerPointDetailModal from "../../(components)/peerpoint/PeerPointDetailModal";

export default function PeerPoints() {
  const [peerPoints, setPeerPoints] = useState([]);
  const [filteredPeerPoints, setFilteredPeerPoints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeerPoint, setSelectedPeerPoint] = useState(null);

  const filterPeerPoints = useCallback(() => {
    let filtered = peerPoints;

    if (searchTerm) {
      filtered = filtered.filter(pp =>
        pp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pp.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(pp => pp.type === selectedType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(pp => pp.status === selectedStatus);
    }

    setFilteredPeerPoints(filtered);
  }, [peerPoints, searchTerm, selectedType, selectedStatus]);

  useEffect(() => {
    loadPeerPoints();
  }, []);

  useEffect(() => {
    filterPeerPoints();
  }, [filterPeerPoints]);

  const loadPeerPoints = async () => {
    setIsLoading(true);
    try {
      const data = await PeerPoint.map(p => ({...p}));
      setPeerPoints(data);
    } catch (error) {
      console.error("Error loading PeerPoints:", error);
    }
    setIsLoading(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "code_review": return "💻";
      case "ui_ux_feedback": return "🎨";
      case "security_check": return "🔒";
      case "general_feedback": return "💬";
      default: return "📝";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "code_review": return "bg-blue-100 text-blue-800";
      case "ui_ux_feedback": return "bg-purple-100 text-purple-800";
      case "security_check": return "bg-red-100 text-red-800";
      case "general_feedback": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewMore = (peerPoint) => {
    setSelectedPeerPoint(peerPoint);
  };

  const handleSendRequest = (peerPoint) => {
    console.log("Sending request for PeerPoint:", peerPoint.title);
    setSelectedPeerPoint(null); 
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {Array(5).fill(0).map((_, i) => (
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">PeerPoints</h1>
        <p className="text-slate-600">Get feedback on your work or help others by providing yours.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Available PeerPoints</p>
                <p className="text-2xl font-bold">{peerPoints.filter(r => r.status === "open").length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Total Bounty</p>
                <p className="text-2xl font-bold">${peerPoints.reduce((sum, r) => sum + (r.bounty || 0), 0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search PeerPoints, technologies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-emerald-200"
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 bg-white/70 backdrop-blur-sm border-emerald-200">
                <SelectValue placeholder="PeerPoint Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="code_review">Code Review</SelectItem>
                <SelectItem value="ui_ux_feedback">UI/UX Feedback</SelectItem>
                <SelectItem value="security_check">Security Check</SelectItem>
                <SelectItem value="general_feedback">General Feedback</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32 bg-white/70 backdrop-blur-sm border-emerald-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
        {filteredPeerPoints.map((pp) => (
          <Card key={pp.id} className="bg-white/70 backdrop-blur-sm border-emerald-200/60 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(pp.type)}</span>
                    <CardTitle className="text-lg">{pp.title}</CardTitle>
                    <Badge className={getTypeColor(pp.type)}>{pp.type.replace(/_/g, ' ')}</Badge>
                    <Badge className={getStatusColor(pp.status)}>{pp.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-slate-600 mb-3">{pp.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {pp.tags?.map((tag, index) => <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                </div>
                <div className="text-right ml-6">
                  {pp.bounty && <div className="text-2xl font-bold text-emerald-600 mb-1">${pp.bounty}</div>}
                  {pp.rating && <div className="flex items-center gap-1 text-yellow-500"><Star className="w-4 h-4 fill-current" /><span className="font-medium">{pp.rating}</span></div>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>By {pp.requester}</span>
                  {pp.reviewer && <span>• Reviewer: {pp.reviewer}</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewMore(pp)}>View More</Button>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={() => handleSendRequest(pp)}>
                    {pp.status === "open" ? "Send Request" : "View Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredPeerPoints.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No PeerPoints found</h3>
          <p className="text-slate-600">Try adjusting your search criteria or filters.</p>
        </motion.div>
      )}

      <PeerPointDetailModal
        peerPoint={selectedPeerPoint}
        isOpen={!!selectedPeerPoint}
        onClose={() => setSelectedPeerPoint(null)}
        onSendRequest={handleSendRequest}
      />
    </div>
  );
}